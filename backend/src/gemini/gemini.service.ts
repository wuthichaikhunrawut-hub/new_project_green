import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ChatLog } from './entities/gemini.entity';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import * as crypto from 'crypto';

export interface BillScanResult {
  type: string;
  amount: number;
  unit: string;
  date: string;
  confidence: number;
  rawText: string;
}

export interface ChatResult {
  reply: string;
}

const MODEL = 'gemini-2.5-flash';

@Injectable()
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private orgCooldowns = new Map<number, { until: Date; reason: string }>();

  private isCooldownActive(orgId: number): boolean {
    const cd = this.orgCooldowns.get(orgId);
    if (!cd) return false;
    if (new Date() < cd.until) {
      console.warn(
        `[AI Cache] Circuit breaker active for Org ID ${orgId} until ${cd.until.toISOString()}. Reason: ${cd.reason}`,
      );
      return true;
    }
    this.orgCooldowns.delete(orgId);
    return false;
  }

  private setCooldown(orgId: number, durationMinutes: number, reason: string) {
    const until = new Date(Date.now() + durationMinutes * 60 * 1000);
    this.orgCooldowns.set(orgId, { until, reason });
    console.log(
      `[AI Cache] Set circuit breaker cooldown for Org ID ${orgId} for ${durationMinutes} minutes. Reason: ${reason}`,
    );
  }

  constructor(
    @InjectRepository(ChatLog)
    private readonly chatLogRepo: Repository<ChatLog>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  private getClient(): GoogleGenAI {
    if (this.ai) return this.ai;

    const apiKey = process.env.GEMINI_API_KEY;
    if (
      !apiKey ||
      apiKey === 'your_api_key_here' ||
      apiKey === 'your_secure_api_key_here'
    ) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY is not configured. Please set it in backend/.env and restart the server.',
      );
    }
    console.log(
      '[GeminiService] Initializing with API Key:',
      apiKey.substring(0, 10) + '...',
    );
    this.ai = new GoogleGenAI({ apiKey });
    return this.ai;
  }

  private withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string,
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs),
      ),
    ]);
  }

  private translateAiError(error: any): string {
    const msg = String(error?.message || '').toLowerCase();
    if (msg.includes('timeout')) {
      return 'ปัญญาประดิษฐ์ใช้เวลาตอบสนองนานเกินไป (Timeout) กรุณาลองใหม่อีกครั้ง';
    }
    if (msg.includes('429') || msg.includes('quota') || msg.includes('limit')) {
      return 'โควตาการใช้งาน AI เต็มรูปแบบชั่วคราว กรุณารอ 1-2 นาทีแล้วลองใหม่อีกครั้ง';
    }
    if (
      msg.includes('api_key') ||
      msg.includes('unauthorized') ||
      msg.includes('key')
    ) {
      return 'ระบบเชื่อมต่อ AI ไม่ถูกต้อง (API Key มีปัญหา) กรุณาติดต่อผู้ดูแลระบบ';
    }
    return 'ไม่สามารถประมวลผลผ่าน AI ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง';
  }

  private async executeWithFallback<T>(
    fn: (aiClient: GoogleGenAI) => Promise<T>,
  ): Promise<T> {
    const timeoutMs = 15000;
    const errMsg = 'Timeout';

    try {
      const ai = this.getClient();
      return await this.withTimeout(fn(ai), timeoutMs, errMsg);
    } catch (error: any) {
      if (error.message === errMsg) {
        throw error;
      }

      console.warn(
        '[GeminiService] Primary API key failed, checking backup key...',
        error.message || error,
      );

      const backupKey =
        process.env.GEMINI_BACKUP_API_KEY || process.env.GEMINI_API_KEY_BACKUP;
      if (
        backupKey &&
        backupKey !== 'your_backup_api_key_here' &&
        backupKey !== 'your_backup_gemini_api_key_here'
      ) {
        try {
          console.log(
            '[GeminiService] Switching to backup API key:',
            backupKey.substring(0, 10) + '...',
          );
          const backupAi = new GoogleGenAI({ apiKey: backupKey });
          const result = await this.withTimeout(
            fn(backupAi),
            timeoutMs,
            errMsg,
          );

          this.ai = backupAi;
          return result;
        } catch (backupError: any) {
          console.error(
            '[GeminiService] Both primary and backup API keys failed!',
            backupError.message || backupError,
          );
          if (backupError.message === errMsg) {
            throw backupError;
          }
          throw error;
        }
      }
      throw error;
    }
  }

  private cleanJsonResponse(text: string): string {
    return text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
  }

  async ocr(fileBuffer: Buffer, mimeType: string): Promise<BillScanResult> {
    try {
      const prompt = `You are an expert at reading Thai utility bills (electricity, water, gas, fuel).
Analyze this bill image and extract the following information. Respond ONLY with a valid JSON object, no markdown, no explanation.

{
  "type": "<activity type in Thai, e.g. ไฟฟ้า, น้ำประปา, ก๊าซ, น้ำมัน>",
  "amount": <numeric usage amount, numbers only>,
  "unit": "<unit in Thai, e.g. kWh, หน่วย, ลิตร, ลบ.ม.>",
  "date": "<billing month/year in Thai format, e.g. มกราคม 2568>",
  "confidence": <confidence percentage 0-100 as integer>,
  "rawText": "<brief summary of key info found on the bill>"
}

If you cannot determine a value, use a sensible default (0 for numbers, "ไม่ทราบ" for strings).`;

      const response = await this.executeWithFallback(async (ai) => {
        return ai.models.generateContent({
          model: MODEL,
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    data: fileBuffer.toString('base64'),
                    mimeType: mimeType,
                  },
                },
              ],
            },
          ],
        });
      });

      const text = response.text?.trim() || '';
      const parsed: BillScanResult = JSON.parse(this.cleanJsonResponse(text));
      return parsed;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new InternalServerErrorException(this.translateAiError(error));
    }
  }

  async getSessions(userId: number): Promise<any[]> {
    const sessions = await this.chatLogRepo
      .createQueryBuilder('log')
      .select('log.session_id', 'id')
      .addSelect('MAX(log.session_title)', 'title')
      .addSelect('MAX(log.created_at)', 'updated_at')
      .where('log.user_id = :userId AND log.session_id IS NOT NULL', { userId })
      .groupBy('log.session_id')
      .orderBy('MAX(log.created_at)', 'DESC')
      .getRawMany();

    return sessions.map((s) => ({
      id: Number(s.id),
      title: s.title,
      user_id: userId,
      created_at: s.updated_at,
      updated_at: s.updated_at,
    }));
  }

  async getSessionMessages(sessionId: number, userId: number): Promise<any[]> {
    const logs = await this.chatLogRepo.find({
      where: { session_id: sessionId, user_id: userId },
      order: { created_at: 'ASC' },
    });

    const messages: any[] = [];
    for (const log of logs) {
      if (log.question) {
        messages.push({
          id: `q-${log.id}`,
          role: 'user',
          content: log.question,
          created_at: log.created_at,
        });
      }
      if (log.answer) {
        messages.push({
          id: `a-${log.id}`,
          role: 'assistant',
          content: log.answer,
          created_at: log.created_at,
        });
      }
    }
    return messages;
  }

  createSession(userId: number, title: string): Promise<any> {
    const sessionId =
      Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
    return Promise.resolve({
      id: sessionId,
      title: title,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  async deleteSession(sessionId: number, userId: number): Promise<void> {
    await this.chatLogRepo.delete({ session_id: sessionId, user_id: userId });
  }

  async chat(
    message: string,
    userId?: number,
    sessionId?: number,
  ): Promise<ChatResult> {
    try {
      let orgContext = '';
      if (userId) {
        try {
          const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['organization'],
          });
          const org = user?.organization;
          if (org) {
            const branches = (await this.orgRepo.manager
              .find('OrganizationUnit', {
                where: { org_id: org.id },
              })
              .catch(() => [])) as any[];

            const carbonLogs = (await this.orgRepo.manager
              .find('CarbonLog', {
                where: { org_id: org.id },
                relations: ['emission_factor'],
              })
              .catch(() => [])) as any[];

            const carbonMap = new Map<
              string,
              { total_amount: number; total_emission: number; unit: string }
            >();
            for (const log of carbonLogs) {
              const type = log.activity_type || 'ทั่วไป';
              const unit = log.emission_factor?.unit || 'หน่วย';
              const existing = carbonMap.get(type) || {
                total_amount: 0,
                total_emission: 0,
                unit,
              };
              existing.total_amount += Number(log.usage_amount || 0);
              existing.total_emission += Number(log.total_emission || 0);
              carbonMap.set(type, existing);
            }
            const carbonSummary = Array.from(carbonMap.entries()).map(
              ([type, val]) => ({
                type,
                total_amount: val.total_amount,
                total_emission: val.total_emission,
                unit: val.unit,
              }),
            );

            const assessments = (await this.orgRepo.manager
              .find('Assessment', {
                where: { org_id: org.id },
              })
              .catch(() => [])) as any[];

            orgContext = `--- ข้อมูลสภาพแวดล้อมและพลังงานขององค์กรปัจจุบัน (${org.name}) ---
อุตสาหกรรม: ${org.industry_type || '-'}
จำนวนพนักงาน: ${org.number_of_employees || 0} คน
พื้นที่ใช้สอยทั้งหมด: ${org.total_floor_area || 0} ตร.ม.
ชั่วโมงการทำงาน/ปี: ${org.working_hours_per_year || 0} ชม.
เป้าหมายการลดคาร์บอน: ${org.target_reduction_percent || 0}%

สาขาขององค์กร (${branches.length} สาขา):
${branches.length === 0 ? '- ยังไม่มีข้อมูลสาขา' : branches.map((b: any) => `- สาขา ${b.unit_name} (ประเภท: ${b.unit_type || 'สำนักงาน'}, พื้นที่: ${b.area || 0} ตร.ม.)`).join('\n')}

ข้อมูลการใช้พลังงานและการปล่อยคาร์บอนสะสม (Carbon Footprint Summary):
${carbonSummary.length === 0 ? '- ยังไม่มีข้อมูลการใช้พลังงานใดๆ บันทึกในระบบ' : carbonSummary.map((c: any) => `- ${c.type}: ใช้ไปสะสมรวม ${Number(c.total_amount).toFixed(2)} ${c.unit} (คิดเป็นการปล่อยคาร์บอนสะสม ${Number(c.total_emission).toFixed(2)} kgCO2e)`).join('\n')}

ความคืบหน้าแบบประเมินหลักเกณฑ์สำนักงานสีเขียว (Green Office Assessment Progress):
${assessments.length === 0 ? '- ยังไม่มีความคืบหน้าแบบประเมิน' : assessments.map((a: any) => `- การประเมินปี ${a.assessment_year || 2026}: สถานะ [${a.status}] (คะแนนรวม: ${a.total_score || 0})`).join('\n')}
------------------------------------------------------
`;
          }
        } catch (ctxErr) {
          console.error(
            '[GeminiService] Failed to compile org context for AI prompt:',
            ctxErr,
          );
        }
      }

      const systemContext = `คุณคือ GreenBot ผู้ช่วย AI ของระบบ Green Sync ที่เชี่ยวชาญด้าน:
1. การประเมินสำนักงานสีเขียว (Green Office) ตามมาตรฐานกระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม
2. การคำนวณและลดการปล่อยก๊าซเรือนกระจก (Carbon Footprint)
3. เกณฑ์การประเมินสำนักงานสีเขียว (Green Office Criteria 6 หมวดหลัก)
4. แนวทางการจัดการพลังงาน น้ำ ขยะ และสิ่งแวดล้อมในสำนักงาน

คำสั่งสำคัญ: 
- ตอบเป็นภาษาไทยเสมอ ใช้ภาษาที่เป็นมิตรและชัดเจน
- ตอบโดยวิเคราะห์อ้างอิงจาก "ข้อมูลสภาพแวดล้อมและพลังงานขององค์กรปัจจุบัน" ด้านล่างนี้เสมอ เพื่อตอบคำถามผู้ใช้เกี่ยวกับสถิติ ตัวเลข ปริมาณสาขา หรือปริมาณการใช้พลังงานขององค์กรปัจจุบันได้ถูกต้องแม่นยำที่สุด
- หากผู้ใช้ถามเกี่ยวกับสถิติคาร์บอน ปริมาณการใช้พลังงาน หรือสาขาที่มี ให้ดึงจากข้อมูลสภาพแวดล้อมด้านล่างนี้ตอบผู้ใช้ทันที ห้ามบอกว่าไม่มีข้อมูลเด็ดขาด
- หากผู้ใช้เริ่มบทสนทนาใหม่ คุณสามารถกล่าวทักทายได้
- แต่ถ้าคุณมีประวัติการสนทนากับผู้ใช้อยู่แล้ว ห้ามกล่าว "สวัสดีครับ! GreenBot ยินดีให้บริการครับ" หรือคำทักทายซ้ำอีกเด็ดขาด ให้ตอบคำถามตรงๆ ได้เลย
- ถ้าคำถามไม่เกี่ยวกับหัวข้อข้างต้น ให้แจ้งว่าคุณช่วยได้เฉพาะเรื่อง Green Office และ Carbon Footprint เท่านั้น

${orgContext}`;

      let historyContext = '';
      let sessionTitle = 'New Conversation';

      if (userId && sessionId) {
        // Query previous messages from ChatLog for this session
        const prevLogs = await this.chatLogRepo.find({
          where: { session_id: sessionId, user_id: userId },
          order: { created_at: 'DESC' },
          take: 5,
        });

        if (prevLogs.length > 0) {
          // Use the latest logged session title
          sessionTitle = prevLogs[0].session_title || 'New Conversation';

          const recentMessages = prevLogs.reverse();
          historyContext =
            '--- ประวัติการสนทนาก่อนหน้า ---\n' +
            recentMessages
              .map((m) => `ผู้ใช้: ${m.question}\nGreenBot: ${m.answer}`)
              .join('\n\n') +
            '\n------------------------------\n\n';
        }
      }

      const fullPrompt = `${systemContext}\n\n${historyContext}ผู้ใช้: ${message}\n\nGreenBot:`;

      const response = await this.executeWithFallback(async (aiClient) => {
        return aiClient.models.generateContent({
          model: MODEL,
          contents: fullPrompt,
        });
      });

      const reply =
        response.text?.trim() || 'ขออภัย ไม่สามารถตอบกลับได้ในขณะนี้';

      try {
        // Always save to flat ChatLog history table so it instantly shows up in history drawer
        if (userId) {
          if (sessionId && sessionTitle === 'New Conversation') {
            sessionTitle =
              message.substring(0, 30) + (message.length > 30 ? '...' : '');
          }

          const flatLog = this.chatLogRepo.create({
            user_id: userId,
            question: message,
            answer: reply,
            intent: 'Chat',
            related_module: 'gemini',
            confidence_score: 1.0,
            session_id: sessionId || null,
            session_title: sessionId ? sessionTitle : null,
          });
          await this.chatLogRepo.save(flatLog);
        }
      } catch (dbError) {
        console.error('Failed to save chat log:', dbError);
      }

      return { reply };
    } catch (error) {
      console.error('Gemini chat error:', error);
      throw new InternalServerErrorException(this.translateAiError(error));
    }
  }

  async validateEvidence(
    fileBuffer: Buffer,
    mimeType: string,
    categoryId: string,
  ): Promise<any> {
    try {
      const prompt = `คุณคือผู้เชี่ยวชาญการตรวจประเมินสำนักงานสีเขียว (Green Office)
กรุณาวิเคราะห์เอกสารหลักฐานที่แนบมานี้ ว่ามีความสอดคล้องกับเกณฑ์การประเมินหมวดที่ ${categoryId} หรือไม่
ให้ตอบกลับเป็น JSON format เท่านั้น ห้ามมีข้อความอื่น:
{
  "isValid": true/false,
  "confidenceScore": <ตัวเลข 0-100>,
  "findings": "<สรุปสั้นๆ ว่าพบอะไรในเอกสารที่เกี่ยวข้องกับเกณฑ์>",
  "missingItems": ["<สิ่งที่ยังขาดหายไป หรือควรเพิ่มเติมเพื่อให้สมบูรณ์>", ...]
}`;

      const response = await this.executeWithFallback(async (aiClient) => {
        return aiClient.models.generateContent({
          model: MODEL,
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    data: fileBuffer.toString('base64'),
                    mimeType: mimeType,
                  },
                },
              ],
            },
          ],
        });
      });

      const text = response.text?.trim() || '';
      return JSON.parse(this.cleanJsonResponse(text));
    } catch (error) {
      console.error('Gemini Evidence Validation error:', error);
      throw new InternalServerErrorException(this.translateAiError(error));
    }
  }

  async getChatHistory(userId: number): Promise<ChatLog[]> {
    return this.chatLogRepo.find({
      where: { user_id: userId },
      order: { created_at: 'ASC' },
    });
  }

  async clearChatHistory(userId: number): Promise<void> {
    await this.chatLogRepo.delete({ user_id: userId });
  }

  async deleteChatLogs(ids: number[], userId: number): Promise<void> {
    await this.chatLogRepo.delete({ id: In(ids), user_id: userId });
  }

  async generateExecutiveSummary(data: any, userId?: number): Promise<any> {
    let org: Organization | null = null;
    let currentHash = '';

    if (userId) {
      const user = await this.userRepo.findOne({
        where: { id: userId },
        relations: ['organization'],
      });
      org = user?.organization || null;
    }

    const currentDataString = `${data.greenScore || 0}-${data.carbonTotal || 0}-${data.orgTarget || 0}-${JSON.stringify(data.extra || {})}`;
    currentHash = crypto
      .createHash('sha256')
      .update(currentDataString)
      .digest('hex');

    // 1. Check if Circuit Breaker Cooldown is active
    if (org && this.isCooldownActive(org.id) && org.cached_executive_summary) {
      console.log(
        '[AI Cache] Circuit breaker active for Executive Summary. Serving cached summary.',
      );
      return {
        summary: org.cached_executive_summary,
        lastAnalyzedAt: org.last_summary_analyzed_at,
        isFallback: true,
      };
    }

    // 2. Check if Cache Hash matches
    if (
      org &&
      org.last_summary_hash === currentHash &&
      org.cached_executive_summary
    ) {
      console.log('[AI Cache] Executive Summary cache hit for Org ID:', org.id);
      return {
        summary: org.cached_executive_summary,
        lastAnalyzedAt: org.last_summary_analyzed_at,
      };
    }

    try {
      const prompt = `คุณคือ AI ผู้เชี่ยวชาญด้าน Sustainability (ESG) ระดับองค์กร
วิเคราะห์ข้อมูลต่อไปนี้เพื่อสรุป Executive Summary สั้นๆ แบบมืออาชีพ สำหรับผู้บริหาร:
ข้อมูลองค์กร:
- คะแนนสำนักงานสีเขียวปัจจุบัน: ${data.greenScore || 0}%
- เปรียบเทียบเป้าหมายการลดคาร์บอน: ปัจจุบัน ${data.carbonTotal || 0} tCO2e (เป้าหมายลด ${data.orgTarget || 0}%)
- ข้อมูลเพิ่มเติม: ${JSON.stringify(data.extra || {})}

ตอบกลับเป็นภาษาไทยเชิงธุรกิจ ความยาวไม่เกิน 4-5 ประโยค ชี้ให้เห็นถึงความเสี่ยง แนวโน้ม หรือความสำเร็จที่โดดเด่นเท่านั้น`;

      console.log(
        '[AI Cache] Executive Summary cache mismatch. Fetching fresh summary from Gemini...',
      );
      const response = await this.executeWithFallback(async (aiClient) => {
        return aiClient.models.generateContent({
          model: MODEL,
          contents: prompt,
        });
      });

      const text = response.text?.trim() || '';

      if (org) {
        org.cached_executive_summary = text;
        org.last_summary_hash = currentHash;
        org.last_summary_analyzed_at = new Date();
        await this.orgRepo.save(org);
      }

      return { summary: text };
    } catch (error) {
      console.error('Gemini Executive Summary error:', error);

      if (org) {
        // Set cooldown for 5 minutes when API fails (like 429 quota exhaustion)
        const errMsg = (error as Error).message || '';
        const reason =
          errMsg.includes('429') || errMsg.includes('quota')
            ? 'Rate limit (429) exceeded'
            : 'API Connection Failure';
        this.setCooldown(org.id, 5, reason);

        // Fallback to previous cached summary if available
        if (org.cached_executive_summary) {
          console.warn(
            '[AI Cache] Gemini API failed. Falling back to previous cached summary.',
          );
          return {
            summary: org.cached_executive_summary,
            lastAnalyzedAt: org.last_summary_analyzed_at,
            isFallback: true,
          };
        }
      }

      throw new InternalServerErrorException(this.translateAiError(error));
    }
  }

  async getRecommendations(data: any, userId?: number): Promise<any> {
    let org: Organization | null = null;
    let currentHash = '';

    if (userId) {
      const user = await this.userRepo.findOne({
        where: { id: userId },
        relations: ['organization'],
      });
      org = user?.organization || null;
    }

    const currentDataString = `${JSON.stringify(data.weakPoints || [])}`;
    currentHash = crypto
      .createHash('sha256')
      .update(currentDataString)
      .digest('hex');

    // 1. Check if Circuit Breaker Cooldown is active
    if (org && this.isCooldownActive(org.id) && org.cached_recommendations) {
      console.log(
        '[AI Cache] Circuit breaker active for Recommendations. Serving cached recommendations.',
      );
      try {
        const parsed = JSON.parse(org.cached_recommendations);
        return {
          ...parsed,
          isFallback: true,
          lastAnalyzedAt: org.last_recommendations_analyzed_at,
        };
      } catch (err) {
        console.error(
          '[AI Cache] Failed to parse cached recommendations during cooldown.',
          err,
        );
      }
    }

    // 2. Check if Cache Hash matches
    if (
      org &&
      org.last_recommendations_hash === currentHash &&
      org.cached_recommendations
    ) {
      console.log('[AI Cache] Recommendations cache hit for Org ID:', org.id);
      try {
        return JSON.parse(org.cached_recommendations);
      } catch (err) {
        console.error(
          '[AI Cache] Failed to parse cached recommendations JSON, fetching fresh...',
          err,
        );
      }
    }

    try {
      const prompt = `คุณคือ AI Recommendation Engine ด้าน Green Office
จากข้อมูลจุดอ่อนขององค์กรนี้: ${JSON.stringify(data.weakPoints || [])}
กรุณาสร้าง Action Plan เป็น JSON เท่านั้น ในรูปแบบ:
{
  "recommendations": [
    {
      "title": "หัวข้อที่ควรปรับปรุง",
      "action": "วิธีการปรับปรุงแบบรูปธรรม",
      "expectedImpact": "High/Medium/Low"
    }
  ],
  "missingDocuments": ["เอกสาร ก.", "เอกสาร ข."]
}`;

      console.log(
        '[AI Cache] Recommendations cache mismatch. Fetching fresh Action Plan from Gemini...',
      );
      const response = await this.executeWithFallback(async (aiClient) => {
        return aiClient.models.generateContent({
          model: MODEL,
          contents: prompt,
        });
      });

      let text = response.text?.trim() || '';
      text = this.cleanJsonResponse(text);
      const parsed = JSON.parse(text);

      if (org) {
        org.cached_recommendations = text;
        org.last_recommendations_hash = currentHash;
        org.last_recommendations_analyzed_at = new Date();
        await this.orgRepo.save(org);
      }

      return parsed;
    } catch (error) {
      console.error('Gemini Recommendations error:', error);

      if (org) {
        // Set cooldown for 5 minutes when API fails
        const errMsg = (error as Error).message || '';
        const reason =
          errMsg.includes('429') || errMsg.includes('quota')
            ? 'Rate limit (429) exceeded'
            : 'API Connection Failure';
        this.setCooldown(org.id, 5, reason);

        // Fallback to previous cached recommendations if available
        if (org.cached_recommendations) {
          console.warn(
            '[AI Cache] Gemini API failed. Falling back to previous cached recommendations.',
          );
          try {
            const parsed = JSON.parse(org.cached_recommendations);
            return {
              ...parsed,
              isFallback: true,
              lastAnalyzedAt: org.last_recommendations_analyzed_at,
            };
          } catch (err) {
            console.error(
              '[AI Cache] Failed to parse fallback cached recommendations.',
              err,
            );
          }
        }
      }

      throw new InternalServerErrorException(this.translateAiError(error));
    }
  }
}

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatLog } from './entities/gemini.entity';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';
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
      console.warn(`[AI Cache] Circuit breaker active for Org ID ${orgId} until ${cd.until.toISOString()}. Reason: ${cd.reason}`);
      return true;
    }
    this.orgCooldowns.delete(orgId);
    return false;
  }

  private setCooldown(orgId: number, durationMinutes: number, reason: string) {
    const until = new Date(Date.now() + durationMinutes * 60 * 1000);
    this.orgCooldowns.set(orgId, { until, reason });
    console.log(`[AI Cache] Set circuit breaker cooldown for Org ID ${orgId} for ${durationMinutes} minutes. Reason: ${reason}`);
  }

  constructor(
    @InjectRepository(ChatLog)
    private readonly chatLogRepo: Repository<ChatLog>,
    @InjectRepository(ChatSession)
    private readonly chatSessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepo: Repository<ChatMessage>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  private getClient(): GoogleGenAI {
    if (this.ai) return this.ai;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here' || apiKey === 'your_secure_api_key_here') {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY is not configured. Please set it in backend/.env and restart the server.',
      );
    }
    console.log('[GeminiService] Initializing with API Key:', apiKey.substring(0, 10) + '...');
    this.ai = new GoogleGenAI({ apiKey });
    return this.ai;
  }

  private cleanJsonResponse(text: string): string {
    return text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
  }

  async ocr(fileBuffer: Buffer, mimeType: string): Promise<BillScanResult> {
    const ai = this.getClient();

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

      const response = await ai.models.generateContent({
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

      const text = response.text?.trim() || '';
      const parsed: BillScanResult = JSON.parse(this.cleanJsonResponse(text));
      return parsed;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new InternalServerErrorException(
        'AI scan failed: ' + (error as Error).message,
      );
    }
  }

  async getSessions(userId: number): Promise<ChatSession[]> {
    return this.chatSessionRepo.find({
      where: { user_id: userId },
      order: { updated_at: 'DESC' },
    });
  }

  async getSessionMessages(sessionId: number, userId: number): Promise<ChatMessage[]> {
    const session = await this.chatSessionRepo.findOne({
      where: { id: sessionId, user_id: userId },
      relations: ['messages'],
      order: { updated_at: 'DESC' }
    });
    if (!session) throw new InternalServerErrorException('Session not found');
    return session.messages.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  }

  async createSession(userId: number, title: string): Promise<ChatSession> {
    const session = this.chatSessionRepo.create({ user_id: userId, title });
    return this.chatSessionRepo.save(session);
  }

  async deleteSession(sessionId: number, userId: number): Promise<void> {
    await this.chatSessionRepo.delete({ id: sessionId, user_id: userId });
  }

  async chat(message: string, userId?: number, sessionId?: number): Promise<ChatResult> {
    const ai = this.getClient();

    try {
      const systemContext = `คุณคือ GreenBot ผู้ช่วย AI ของระบบ Green Sync ที่เชี่ยวชาญด้าน:
1. การประเมินสำนักงานสีเขียว (Green Office) ตามมาตรฐานกระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม
2. การคำนวณและลดการปล่อยก๊าซเรือนกระจก (Carbon Footprint)
3. เกณฑ์การประเมินสำนักงานสีเขียว 8 หมวด
4. แนวทางการจัดการพลังงาน น้ำ ขยะ และสิ่งแวดล้อมในสำนักงาน

คำสั่งสำคัญ: 
- ตอบเป็นภาษาไทยเสมอ ใช้ภาษาที่เป็นมิตรและชัดเจน
- หากผู้ใช้เริ่มบทสนทนาใหม่ คุณสามารถกล่าวทักทายได้
- แต่ถ้าคุณมีประวัติการสนทนากับผู้ใช้อยู่แล้ว ห้ามกล่าว "สวัสดีครับ! GreenBot ยินดีให้บริการครับ" หรือคำทักทายซ้ำอีกเด็ดขาด ให้ตอบคำถามตรงๆ ได้เลย
- ถ้าคำถามไม่เกี่ยวกับหัวข้อข้างต้น ให้แจ้งว่าคุณช่วยได้เฉพาะเรื่อง Green Office และ Carbon Footprint เท่านั้น`;

      let historyContext = '';
      let session: ChatSession | null = null;
      
      if (userId && sessionId) {
        session = await this.chatSessionRepo.findOne({
          where: { id: sessionId, user_id: userId },
          relations: ['messages']
        });
        
        if (session && session.messages.length > 0) {
          const recentMessages = session.messages.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()).slice(0, 10).reverse();
          historyContext = '--- ประวัติการสนทนาก่อนหน้า ---\n' + 
            recentMessages.map(m => `${m.role === 'user' ? 'ผู้ใช้' : 'GreenBot'}: ${m.content}`).join('\n\n') + 
            '\n------------------------------\n\n';
        }
      }

      const fullPrompt = `${systemContext}\n\n${historyContext}ผู้ใช้: ${message}\n\nGreenBot:`;

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: fullPrompt,
      });

      const reply = response.text?.trim() || 'ขออภัย ไม่สามารถตอบกลับได้ในขณะนี้';

      try {
        if (session) {
          const userMsg = this.chatMessageRepo.create({ role: 'user', content: message, session });
          const botMsg = this.chatMessageRepo.create({ role: 'assistant', content: reply, session });
          await this.chatMessageRepo.save([userMsg, botMsg]);
          
          if (session.messages.length === 0 || session.title === 'New Conversation') {
            session.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
            await this.chatSessionRepo.save(session);
          }
        }
      } catch (dbError) {
        console.error('Failed to save chat log:', dbError);
      }

      return { reply };
    } catch (error) {
      console.error('Gemini chat error:', error);
      throw new InternalServerErrorException(
        'ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง',
      );
    }
  }

  async validateEvidence(fileBuffer: Buffer, mimeType: string, categoryId: string): Promise<any> {
    const ai = this.getClient();

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

      const response = await ai.models.generateContent({
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

      const text = response.text?.trim() || '';
      return JSON.parse(this.cleanJsonResponse(text));
    } catch (error) {
      console.error('Gemini Evidence Validation error:', error);
      throw new InternalServerErrorException('การวิเคราะห์หลักฐานล้มเหลว: ' + (error as Error).message);
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

  async generateExecutiveSummary(data: any, userId?: number): Promise<any> {
    let org: Organization | null = null;
    let currentHash = '';

    if (userId) {
      const user = await this.userRepo.findOne({
        where: { id: userId },
        relations: ['organization']
      });
      org = user?.organization || null;
    }

    const currentDataString = `${data.greenScore || 0}-${data.carbonTotal || 0}-${data.orgTarget || 0}-${JSON.stringify(data.extra || {})}`;
    currentHash = crypto.createHash('sha256').update(currentDataString).digest('hex');

    // 1. Check if Circuit Breaker Cooldown is active
    if (org && this.isCooldownActive(org.id) && org.cached_executive_summary) {
      console.log('[AI Cache] Circuit breaker active for Executive Summary. Serving cached summary.');
      return { 
        summary: org.cached_executive_summary, 
        lastAnalyzedAt: org.last_summary_analyzed_at,
        isFallback: true 
      };
    }

    // 2. Check if Cache Hash matches
    if (org && org.last_summary_hash === currentHash && org.cached_executive_summary) {
      console.log('[AI Cache] Executive Summary cache hit for Org ID:', org.id);
      return { 
        summary: org.cached_executive_summary, 
        lastAnalyzedAt: org.last_summary_analyzed_at 
      };
    }

    const ai = this.getClient();

    try {
      const prompt = `คุณคือ AI ผู้เชี่ยวชาญด้าน Sustainability (ESG) ระดับองค์กร
วิเคราะห์ข้อมูลต่อไปนี้เพื่อสรุป Executive Summary สั้นๆ แบบมืออาชีพ สำหรับผู้บริหาร:
ข้อมูลองค์กร:
- คะแนนสำนักงานสีเขียวปัจจุบัน: ${data.greenScore || 0}%
- เปรียบเทียบเป้าหมายการลดคาร์บอน: ปัจจุบัน ${data.carbonTotal || 0} tCO2e (เป้าหมายลด ${data.orgTarget || 0}%)
- ข้อมูลเพิ่มเติม: ${JSON.stringify(data.extra || {})}

ตอบกลับเป็นภาษาไทยเชิงธุรกิจ ความยาวไม่เกิน 4-5 ประโยค ชี้ให้เห็นถึงความเสี่ยง แนวโน้ม หรือความสำเร็จที่โดดเด่นเท่านั้น`;

      console.log('[AI Cache] Executive Summary cache mismatch. Fetching fresh summary from Gemini...');
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
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
        const reason = errMsg.includes('429') || errMsg.includes('quota') ? 'Rate limit (429) exceeded' : 'API Connection Failure';
        this.setCooldown(org.id, 5, reason);

        // Fallback to previous cached summary if available
        if (org.cached_executive_summary) {
          console.warn('[AI Cache] Gemini API failed. Falling back to previous cached summary.');
          return { 
            summary: org.cached_executive_summary, 
            lastAnalyzedAt: org.last_summary_analyzed_at,
            isFallback: true 
          };
        }
      }
      
      throw new InternalServerErrorException('การสร้างข้อมูลสรุปล้มเหลว');
    }
  }

  async getRecommendations(data: any, userId?: number): Promise<any> {
    let org: Organization | null = null;
    let currentHash = '';

    if (userId) {
      const user = await this.userRepo.findOne({
        where: { id: userId },
        relations: ['organization']
      });
      org = user?.organization || null;
    }

    const currentDataString = `${JSON.stringify(data.weakPoints || [])}`;
    currentHash = crypto.createHash('sha256').update(currentDataString).digest('hex');

    // 1. Check if Circuit Breaker Cooldown is active
    if (org && this.isCooldownActive(org.id) && org.cached_recommendations) {
      console.log('[AI Cache] Circuit breaker active for Recommendations. Serving cached recommendations.');
      try {
        const parsed = JSON.parse(org.cached_recommendations);
        return {
          ...parsed,
          isFallback: true,
          lastAnalyzedAt: org.last_recommendations_analyzed_at
        };
      } catch (err) {
        console.error('[AI Cache] Failed to parse cached recommendations during cooldown.', err);
      }
    }

    // 2. Check if Cache Hash matches
    if (org && org.last_recommendations_hash === currentHash && org.cached_recommendations) {
      console.log('[AI Cache] Recommendations cache hit for Org ID:', org.id);
      try {
        return JSON.parse(org.cached_recommendations);
      } catch (err) {
        console.error('[AI Cache] Failed to parse cached recommendations JSON, fetching fresh...', err);
      }
    }

    const ai = this.getClient();

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

      console.log('[AI Cache] Recommendations cache mismatch. Fetching fresh Action Plan from Gemini...');
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
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
        const reason = errMsg.includes('429') || errMsg.includes('quota') ? 'Rate limit (429) exceeded' : 'API Connection Failure';
        this.setCooldown(org.id, 5, reason);

        // Fallback to previous cached recommendations if available
        if (org.cached_recommendations) {
          console.warn('[AI Cache] Gemini API failed. Falling back to previous cached recommendations.');
          try {
            const parsed = JSON.parse(org.cached_recommendations);
            return {
              ...parsed,
              isFallback: true,
              lastAnalyzedAt: org.last_recommendations_analyzed_at
            };
          } catch (err) {
            console.error('[AI Cache] Failed to parse fallback cached recommendations.', err);
          }
        }
      }

      throw new InternalServerErrorException('การสร้างคำแนะนำล้มเหลว');
    }
  }
}

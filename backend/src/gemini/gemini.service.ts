import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatLog } from './entities/gemini.entity';

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

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(
    @InjectRepository(ChatLog)
    private readonly chatLogRepo: Repository<ChatLog>,
  ) {
    // Initialize lazily — key is validated when uploadBill() is called
    this.genAI = null as any;
  }

  async ocr(fileBuffer: Buffer, mimeType: string): Promise<BillScanResult> {
    // Lazy init — validate key only when endpoint is called
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY is not configured. Please set it in backend/.env and restart the server.',
      );
    }
    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

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

      const imagePart = {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: mimeType,
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text().trim();

      // Strip markdown code fences if present
      const jsonText = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      const parsed: BillScanResult = JSON.parse(jsonText);
      return parsed;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new InternalServerErrorException(
        'AI scan failed: ' + (error as Error).message,
      );
    }
  }

  async chat(message: string, userId?: number): Promise<ChatResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY is not configured. Please set it in backend/.env',
      );
    }
    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      const systemContext = `คุณคือ GreenBot ผู้ช่วย AI ของระบบ Green Sync ที่เชี่ยวชาญด้าน:
1. การประเมินสำนักงานสีเขียว (Green Office) ตามมาตรฐานกระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม
2. การคำนวณและลดการปล่อยก๊าซเรือนกระจก (Carbon Footprint)
3. เกณฑ์การประเมินสำนักงานสีเขียว 8 หมวด
4. แนวทางการจัดการพลังงาน น้ำ ขยะ และสิ่งแวดล้อมในสำนักงาน

ตอบเป็นภาษาไทยเสมอ ใช้ภาษาที่เป็นมิตร ชัดเจน และให้ข้อมูลที่เป็นประโยชน์ ถ้าคำถามไม่เกี่ยวกับหัวข้อข้างต้น ให้แจ้งว่าคุณช่วยได้เฉพาะเรื่อง Green Office และ Carbon Footprint เท่านั้น`;

      const fullPrompt = `${systemContext}\n\nผู้ใช้: ${message}\n\nGreenBot:`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const reply = response.text().trim();

      // Save to database asynchronously to avoid blocking user response
      try {
        const chatLog = this.chatLogRepo.create({
          user_id: userId || null,
          question: message,
          answer: reply,
          intent: 'chat',
          related_module: 'general',
          confidence_score: 1.0,
        });
        await this.chatLogRepo.save(chatLog);
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

  async getChatHistory(userId: number): Promise<ChatLog[]> {
    return this.chatLogRepo.find({
      where: { user_id: userId },
      order: { created_at: 'ASC' },
    });
  }

  async clearChatHistory(userId: number): Promise<void> {
    await this.chatLogRepo.delete({ user_id: userId });
  }
}

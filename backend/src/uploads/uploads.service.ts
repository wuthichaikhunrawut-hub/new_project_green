import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EvidenceFile } from '../assessments/entities/evidence-file.entity';

@Injectable()
export class UploadsService {
  private supabase: SupabaseClient;
  private bucket: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(EvidenceFile)
    private evidenceFileRepository: Repository<EvidenceFile>,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    this.bucket = this.configService.get<string>('SUPABASE_BUCKET') || '';

    if (!supabaseUrl || !supabaseKey || !this.bucket) {
      console.warn('⚠️ Supabase configuration is missing in .env!');
      console.warn('URL:', !!supabaseUrl);
      console.warn('KEY:', !!supabaseKey);
      console.warn('BUCKET:', !!this.bucket);
    } else {
      console.log('🚀 Supabase client initialized for bucket:', this.bucket);
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
        },
      });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'evidence',
    metadata?: {
      assessmentDetailId?: number;
      userId?: number;
      carbonLogId?: number;
      category?: string;
    },
  ): Promise<EvidenceFile> {
    if (!this.supabase) {
      throw new BadRequestException('Supabase client not initialized');
    }

    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const safeName = originalName.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${folder}/${Date.now()}-${safeName}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      console.error('Bucket:', this.bucket);
      console.error('FileName:', fileName);
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    // Get Public URL
    const { data: urlData } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Save to Database
    try {
      const evidenceFile = this.evidenceFileRepository.create({
        file_name: originalName,
        file_url: publicUrl,
        file_type: file.mimetype,
        file_size: file.size,
        assessment_detail_id: metadata?.assessmentDetailId,
        uploaded_by_user_id: metadata?.userId,
        carbon_log_id: metadata?.carbonLogId,
        category: metadata?.category,
      });

      const savedFile = await this.evidenceFileRepository.save(evidenceFile);
      return savedFile;
    } catch (dbError) {
      console.error('❌ Database save error:', dbError);
      throw new BadRequestException(
        `Failed to save evidence record: ${dbError.message}`,
      );
    }
  }

  async deleteFile(id: number) {
    const file = await this.evidenceFileRepository.findOne({ where: { id } });
    if (!file) {
      throw new BadRequestException('File not found');
    }

    // 1. Delete from Supabase Storage
    // Extract path after /public/bucket-name/
    const publicUrlPart = `/public/${this.bucket}/`;
    const path = file.file_url.split(publicUrlPart)[1];
    
    if (path) {
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .remove([path]);

      if (error) {
        console.error('❌ Supabase delete error:', error);
      }
    }

    // 2. Delete from Database
    await this.evidenceFileRepository.delete(id);
    console.log('✅ File deleted from DB and Storage:', id);

    return { success: true };
  }

  async findAll() {
    return await this.evidenceFileRepository.find({
      order: { uploaded_at: 'DESC' },
    });
  }

  async update(id: number, data: { category: string }) {
    await this.evidenceFileRepository.update(id, data);
    return await this.evidenceFileRepository.findOne({ where: { id } });
  }
}

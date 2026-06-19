import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
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
    currentUser?: any,
  ): Promise<EvidenceFile> {
    if (!file) {
      throw new BadRequestException('File is missing');
    }

    const role = currentUser?.role;
    const normalizeRole = (r: string): string => {
      return String(r || '')
        .trim()
        .toUpperCase()
        .replace(/[\s_]/g, '');
    };
    const userRole = normalizeRole(role);

    if (
      userRole !== 'SYSTEMADMIN' &&
      userRole !== 'ASSESSOR' &&
      userRole !== 'ASSESSORADMIN'
    ) {
      const orgId = Number(currentUser?.orgId);

      if (metadata?.assessmentDetailId) {
        const detail = (await this.evidenceFileRepository.manager.findOne(
          'AssessmentDetail',
          {
            where: { id: metadata.assessmentDetailId },
            relations: ['assessment'],
          },
        )) as any;
        if (
          detail &&
          detail.assessment &&
          Number(detail.assessment.org_id) !== orgId
        ) {
          throw new ForbiddenException(
            'คุณไม่มีสิทธิ์อัปโหลดไฟล์ให้การประเมินขององค์กรอื่น',
          );
        }
      }

      if (metadata?.carbonLogId) {
        const log = (await this.evidenceFileRepository.manager.findOne(
          'CarbonLog',
          {
            where: { id: metadata.carbonLogId },
          },
        )) as any;
        if (log && Number(log.org_id) !== orgId) {
          throw new ForbiddenException(
            'คุณไม่มีสิทธิ์อัปโหลดไฟล์ให้ประวัติคาร์บอนขององค์กรอื่น',
          );
        }
      }
    }

    if (!this.supabase || !this.bucket) {
      console.error('❌ Supabase not initialized. Bucket:', this.bucket);
      throw new BadRequestException(
        'Upload system is not ready (Supabase missing)',
      );
    }

    // Handle filename encoding safety
    let originalName = 'unknown_file';
    try {
      originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch (e) {
      originalName = file.originalname || 'file';
    }

    const safeName = originalName.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${folder}/${Date.now()}-${safeName}`;

    console.log(`📤 Uploading to Supabase: ${fileName} (${file.size} bytes)`);

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw new BadRequestException(`Supabase upload failed: ${error.message}`);
    }

    // Get Public URL
    const { data: urlData } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;
    console.log('✅ File uploaded to Supabase, URL:', publicUrl);

    // Save to Database
    try {
      // If it is a certificate upload, DO NOT save it in the evidence_files table.
      // Certificates have their own dedicated table ('certificates') and are linked via certificate_url.
      if (folder === 'certificates') {
        console.log(
          '📜 Certificate file uploaded successfully, skipping EvidenceFile DB record creation.',
        );
        return {
          id: 0,
          file_name: originalName,
          file_url: publicUrl,
          file_type: file.mimetype,
          file_size: file.size,
          uploaded_at: new Date(),
        } as any;
      }

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
      const result = Array.isArray(savedFile) ? savedFile[0] : savedFile;
      console.log('✅ Database record saved:', result.id);
      return result;
    } catch (dbError) {
      console.error('❌ Database save error during upload:', dbError);
      throw new BadRequestException(
        `Failed to save evidence record in DB: ${dbError.message}`,
      );
    }
  }

  private async validateFileOwnership(file: EvidenceFile, currentUser?: any) {
    const role = currentUser?.role;
    const normalizeRole = (r: string): string => {
      return String(r || '')
        .trim()
        .toUpperCase()
        .replace(/[\s_]/g, '');
    };
    const userRole = normalizeRole(role);

    if (
      userRole === 'SYSTEMADMIN' ||
      userRole === 'ASSESSOR' ||
      userRole === 'ASSESSORADMIN'
    ) {
      return; // Admins and assessors are allowed
    }

    const orgId = Number(currentUser?.orgId);
    if (!orgId) {
      throw new ForbiddenException(
        'คุณไม่มีสิทธิ์เข้าถึงไฟล์นี้ (ไม่ระบุองค์กร)',
      );
    }

    let fileOrgId: number | undefined = undefined;

    // Check 1: Uploaded by user's organization
    if (file.uploaded_by?.organization?.id) {
      fileOrgId = Number(file.uploaded_by.organization.id);
    }

    // Check 2: Assessment detail's assessment's organization
    if (file.assessment_detail?.assessment?.org_id) {
      fileOrgId = Number(file.assessment_detail.assessment.org_id);
    }

    // Check 3: Carbon log's organization (if carbon_log_id is present)
    if (file.carbon_log_id) {
      const log = (await this.evidenceFileRepository.manager.findOne(
        'CarbonLog',
        {
          where: { id: file.carbon_log_id },
        },
      )) as any;
      if (log && log.org_id) {
        fileOrgId = Number(log.org_id);
      }
    }

    if (!fileOrgId || fileOrgId !== orgId) {
      throw new ForbiddenException(
        'คุณไม่มีสิทธิ์เข้าถึงหรือจัดการไฟล์ขององค์กรอื่น',
      );
    }
  }

  async findOne(id: number, currentUser?: any): Promise<EvidenceFile> {
    const file = await this.evidenceFileRepository.findOne({
      where: { id },
      relations: [
        'uploaded_by',
        'uploaded_by.organization',
        'assessment_detail',
        'assessment_detail.assessment',
      ],
    });
    if (!file) {
      throw new BadRequestException('File not found');
    }

    await this.validateFileOwnership(file, currentUser);
    return file;
  }

  async deleteFile(id: number, currentUser?: any) {
    const file = await this.evidenceFileRepository.findOne({
      where: { id },
      relations: [
        'uploaded_by',
        'uploaded_by.organization',
        'assessment_detail',
        'assessment_detail.assessment',
      ],
    });
    if (!file) {
      throw new BadRequestException('File not found');
    }

    await this.validateFileOwnership(file, currentUser);

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

  async findAll(currentUser?: any) {
    const role = currentUser?.role;
    const normalizeRole = (r: string): string => {
      return String(r || '')
        .trim()
        .toUpperCase()
        .replace(/[\s_]/g, '');
    };
    const userRole = normalizeRole(role);

    let all = await this.evidenceFileRepository.find({
      relations: [
        'uploaded_by',
        'uploaded_by.organization',
        'assessment_detail',
        'assessment_detail.assessment',
      ],
      order: { uploaded_at: 'DESC' },
    });

    // Filter out any certificate files to ensure they don't leak into evidence files list
    all = all.filter(
      (f) => !f.file_url || !f.file_url.includes('/certificates/'),
    );

    if (
      userRole !== 'SYSTEMADMIN' &&
      userRole !== 'ASSESSOR' &&
      userRole !== 'ASSESSORADMIN'
    ) {
      const orgId = Number(currentUser?.orgId);
      all = all.filter((file) => {
        const fileOrgId =
          file.uploaded_by?.organization?.id ||
          file.assessment_detail?.assessment?.org_id;
        return fileOrgId ? Number(fileOrgId) === orgId : false;
      });
    }

    return all;
  }

  async update(id: number, data: { category: string }, currentUser?: any) {
    const file = await this.evidenceFileRepository.findOne({
      where: { id },
      relations: [
        'uploaded_by',
        'uploaded_by.organization',
        'assessment_detail',
        'assessment_detail.assessment',
      ],
    });
    if (!file) {
      throw new BadRequestException('File not found');
    }

    await this.validateFileOwnership(file, currentUser);

    await this.evidenceFileRepository.update(id, data);
    return await this.evidenceFileRepository.findOne({ where: { id } });
  }
}

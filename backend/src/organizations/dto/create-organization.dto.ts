import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({
    description: 'ชื่อหน่วยงาน/องค์กร',
    example: 'บริษัท กรีนซิสเท็ม จำกัด',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'เลขประจำตัวผู้เสียภาษี 13 หลัก',
    example: '1234567890123',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{13}$/, {
    message: 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก',
  })
  tax_id?: string;

  @ApiPropertyOptional({
    description: 'ประเภทธุรกิจ/อุตสาหกรรม',
    example: 'เทคโนโลยีและซอฟต์แวร์',
  })
  @IsString()
  @IsOptional()
  industry_type?: string;

  @ApiPropertyOptional({ description: 'จำนวนพนักงาน', example: 45 })
  @IsNumber()
  @IsOptional()
  number_of_employees?: number;

  @ApiPropertyOptional({
    description: 'พื้นที่สำนักงานทั้งหมด (ตารางเมตร)',
    example: 850.5,
  })
  @IsNumber()
  @IsOptional()
  total_floor_area?: number;

  @ApiPropertyOptional({
    description: 'ชั่วโมงการทำงานรวมต่อปีของสำนักงาน',
    example: 2000,
  })
  @IsNumber()
  @IsOptional()
  working_hours_per_year?: number;

  @ApiPropertyOptional({
    description: 'ปีฐานที่ใช้อ้างอิงการประเมินคาร์บอน',
    example: 2026,
  })
  @IsNumber()
  @IsOptional()
  base_year?: number;

  @ApiPropertyOptional({
    description: 'เป้าหมายการลดคาร์บอนเป็นเปอร์เซ็นต์',
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  target_reduction_percent?: number;

  @ApiPropertyOptional({
    description: 'สถานะเปิดใช้งานองค์กรในระบบ',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'สถานะการรับรอง Green Office ปัจจุบัน',
    example: 'PENDING',
  })
  @IsString()
  @IsOptional()
  current_green_status?: string;
}

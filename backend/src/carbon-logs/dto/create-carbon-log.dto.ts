import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCarbonLogDto {
  @ApiProperty({
    description: 'ประเภทกิจกรรมคาร์บอน (เช่น Electricity, Water, Gasoline)',
    example: 'Electricity',
  })
  @IsString()
  activity_type: string;

  @ApiProperty({ description: 'เดือนที่ใช้ข้อมูล (1 - 12)', example: 6 })
  @IsNumber()
  month: number;

  @ApiProperty({ description: 'ปี ค.ศ. ที่ใช้ข้อมูล', example: 2026 })
  @IsNumber()
  year: number;

  @ApiProperty({ description: 'จำนวนปริมาณการใช้งานจริง', example: 350.5 })
  @IsNumber()
  usage_amount: number;

  @ApiPropertyOptional({
    description:
      'ปริมาณการปล่อยคาร์บอนรวม (คำนวณอัตโนมัติหากเชื่อมโยงกับ Emission Factor)',
    example: 184.88,
  })
  @IsNumber()
  @IsOptional()
  total_emission?: number;

  @ApiPropertyOptional({
    description: 'รหัส Emission Factor ที่อ้างอิง',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  emission_factor_id?: number;

  @ApiPropertyOptional({
    description: 'URL หรือเส้นทางของไฟล์เอกสารบิลหลักฐานการใช้งาน',
    example: 'https://example.com/evidence/bill-123.pdf',
  })
  @IsString()
  @IsOptional()
  evidence_url?: string;

  @ApiPropertyOptional({
    description: 'แหล่งที่มาหรือหมายเหตุของข้อมูล',
    example: 'มิเตอร์วัดค่าไฟฟ้า อาคาร 1',
  })
  @IsString()
  @IsOptional()
  data_source?: string;

  @ApiPropertyOptional({
    description: 'รหัสหน่วยงานย่อยภายในองค์กร',
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  org_unit_id?: number;
}

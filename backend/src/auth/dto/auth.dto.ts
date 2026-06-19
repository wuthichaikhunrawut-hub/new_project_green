import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrganizationDto } from '../../organizations/dto/create-organization.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserDataDto {
  @ApiProperty({
    description: 'ที่อยู่อีเมลของผู้ใช้งาน',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  email: string;

  @ApiProperty({
    description: 'รหัสผ่านอย่างน้อย 6 ตัวอักษร มีทั้งตัวอักษรและตัวเลข',
    example: 'Password123',
  })
  @IsString()
  @MinLength(6, { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/, {
    message: 'รหัสผ่านต้องประกอบด้วยตัวอักษรและตัวเลขอย่างน้อย 1 ตัว',
  })
  password: string;

  @ApiPropertyOptional({ description: 'ชื่อจริง', example: 'สมชาย' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ description: 'นามสกุล', example: 'รักเรียน' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'เบอร์โทรศัพท์ผู้ติดต่อ',
    example: '0812345678',
  })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class RegisterDto {
  @ApiProperty({ description: 'ข้อมูลสมาชิกผู้ลงทะเบียนหลัก' })
  @ValidateNested()
  @Type(() => UserDataDto)
  @IsNotEmpty()
  userData: UserDataDto;

  @ApiProperty({ description: 'ข้อมูลรายละเอียดหน่วยงาน/องค์กรที่สังกัด' })
  @ValidateNested()
  @Type(() => CreateOrganizationDto)
  @IsNotEmpty()
  orgData: CreateOrganizationDto;
}

export class LoginDto {
  @ApiProperty({
    description: 'อีเมลของผู้ใช้งานในการล็อกอิน',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  email: string;

  @ApiProperty({
    description: 'รหัสผ่านในการเข้าสู่ระบบ',
    example: 'Password123',
  })
  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกรหัสผ่าน' })
  password: string;
}

export class AssessorProfileDataDto {
  @ApiProperty({ description: 'ชื่อจริงของผู้ประเมิน', example: 'วิชัย' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'นามสกุลของผู้ประเมิน', example: 'ใจดี' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({
    description: 'เบอร์โทรศัพท์ติดต่อ',
    example: '0898765432',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'เลขที่ใบอนุญาตผู้ประเมิน',
    example: 'AS-2569-0099',
  })
  @IsString()
  @IsNotEmpty()
  license_number: string;

  @ApiProperty({
    description: 'จำนวนปีของประสบการณ์การทำงานด้านการประเมิน',
    example: '5',
  })
  @IsString()
  @IsNotEmpty()
  years_experience: string;

  @ApiProperty({
    description: 'ประวัติการศึกษาสูงสุด',
    example: 'ปริญญาโท วิศวกรรมสิ่งแวดล้อม',
  })
  @IsString()
  @IsNotEmpty()
  education_background: string;

  @ApiPropertyOptional({
    description: 'ลิงก์ไฟล์ประวัติ/คุณสมบัติ',
    example: 'https://example.com/files/cv.pdf',
  })
  @IsString()
  @IsOptional()
  qualification_file_url?: string;

  @ApiPropertyOptional({
    description: 'ชื่อธนาคารสำหรับรับเงินรางวัล/ค่าตอบแทน',
    example: 'ธนาคารกสิกรไทย',
  })
  @IsString()
  @IsOptional()
  bank_name?: string;

  @ApiPropertyOptional({
    description: 'เลขบัญชีธนาคาร',
    example: '123-4-56789-0',
  })
  @IsString()
  @IsOptional()
  bank_account_no?: string;

  @ApiPropertyOptional({
    description: 'ชื่อบัญชีธนาคาร',
    example: 'นาย วิชัย ใจดี',
  })
  @IsString()
  @IsOptional()
  bank_account_name?: string;
}

export class RegisterAssessorDto {
  @ApiProperty({ description: 'ข้อมูลบัญชีเข้าใช้งานของผู้ประเมิน' })
  @ValidateNested()
  @Type(() => UserDataDto)
  @IsNotEmpty()
  userData: UserDataDto;

  @ApiProperty({ description: 'ข้อมูลประวัติและบัญชีธนาคารของผู้ประเมิน' })
  @ValidateNested()
  @Type(() => AssessorProfileDataDto)
  @IsNotEmpty()
  profileData: AssessorProfileDataDto;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'อีเมลที่ต้องการขอตั้งรหัสผ่านใหม่',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'โทเค็นยืนยันการตั้งรหัสผ่านใหม่ (ได้รับทางอีเมล)',
    example: 'reset-token-uuid-xyz',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'รหัสผ่านใหม่ที่ต้องการตั้งใช้งาน',
    example: 'NewPassword123',
  })
  @IsString()
  @MinLength(6, { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/, {
    message: 'รหัสผ่านต้องประกอบด้วยตัวอักษรและตัวเลขอย่างน้อย 1 ตัว',
  })
  password: string;
}

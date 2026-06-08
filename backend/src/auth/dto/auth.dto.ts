import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional, ValidateNested, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrganizationDto } from '../../organizations/dto/create-organization.dto';

export class UserDataDto {
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/, { message: 'รหัสผ่านต้องประกอบด้วยตัวอักษรและตัวเลขอย่างน้อย 1 ตัว' })
  password: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class RegisterDto {
  @ValidateNested()
  @Type(() => UserDataDto)
  @IsNotEmpty()
  userData: UserDataDto;

  @ValidateNested()
  @Type(() => CreateOrganizationDto)
  @IsNotEmpty()
  orgData: CreateOrganizationDto;
}

export class LoginDto {
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกรหัสผ่าน' })
  password: string;
}

export class AssessorProfileDataDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  license_number: string;

  @IsString()
  @IsNotEmpty()
  years_experience: string;

  @IsString()
  @IsNotEmpty()
  education_background: string;

  @IsString()
  @IsOptional()
  qualification_file_url?: string;

  @IsString()
  @IsOptional()
  bank_name?: string;

  @IsString()
  @IsOptional()
  bank_account_no?: string;

  @IsString()
  @IsOptional()
  bank_account_name?: string;
}

export class RegisterAssessorDto {
  @ValidateNested()
  @Type(() => UserDataDto)
  @IsNotEmpty()
  userData: UserDataDto;

  @ValidateNested()
  @Type(() => AssessorProfileDataDto)
  @IsNotEmpty()
  profileData: AssessorProfileDataDto;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(6, { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/, { message: 'รหัสผ่านต้องประกอบด้วยตัวอักษรและตัวเลขอย่างน้อย 1 ตัว' })
  password: string;
}

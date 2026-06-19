import { PartialType } from '@nestjs/mapped-types';
import { UserRole } from '../entities/user.entity';
import {
  IsString,
  IsEmail,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrganizationDto {
  @IsNumber()
  id: number;
}

class UserProfileDto {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  profile_image?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  role?: UserRole | string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrganizationDto)
  organization?: OrganizationDto;

  @IsOptional()
  @IsNumber()
  org_unit_id?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserProfileDto)
  user_profile?: UserProfileDto;
}

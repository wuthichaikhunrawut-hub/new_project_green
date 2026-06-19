import { IsOptional, IsString } from 'class-validator';

export class UpdateCertificateDto {
  @IsOptional()
  @IsString()
  certificate_no?: string;

  @IsOptional()
  @IsString()
  issued_at?: string;

  @IsOptional()
  @IsString()
  expired_at?: string;

  @IsOptional()
  @IsString()
  certificate_url?: string;
}

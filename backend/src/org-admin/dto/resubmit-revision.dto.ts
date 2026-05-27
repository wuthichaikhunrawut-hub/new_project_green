import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ResubmitRevisionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

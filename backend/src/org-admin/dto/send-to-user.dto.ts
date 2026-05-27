import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SendToUserDto {
  @IsString()
  @IsNotEmpty({ message: 'กรุณาระบุข้อความ' })
  @MaxLength(1000)
  notes: string;
}

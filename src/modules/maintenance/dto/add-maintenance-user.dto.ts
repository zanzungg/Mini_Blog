import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddMaintenanceUserDto {
  @IsString()
  @IsEmail()
  @ApiProperty({ type: 'string', format: 'email' })
  email!: string;
}

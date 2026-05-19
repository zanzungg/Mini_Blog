import { IsIP, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddMaintenanceIpDto {
  @IsString()
  @IsIP()
  @ApiProperty({ type: 'string', example: '127.0.0.1' })
  ip!: string;
}

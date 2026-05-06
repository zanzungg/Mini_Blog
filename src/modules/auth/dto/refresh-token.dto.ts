import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @IsString()
  @MinLength(20)
  @ApiProperty({ minLength: 20 })
  refreshToken!: string;
}

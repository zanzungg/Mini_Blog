import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @ApiPropertyOptional({ minLength: 2, maxLength: 50 })
  name!: string | null;
}

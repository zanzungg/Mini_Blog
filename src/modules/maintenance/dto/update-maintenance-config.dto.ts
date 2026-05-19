import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMaintenanceConfigDto {
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ type: 'boolean' })
  enabled?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  @ApiPropertyOptional({ minLength: 1, maxLength: 500 })
  message?: string;
}

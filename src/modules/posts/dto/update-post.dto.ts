import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @ApiPropertyOptional({ minLength: 1, maxLength: 200 })
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @ApiPropertyOptional()
  content?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ type: 'number', minimum: 1, nullable: true })
  categoryId?: number | null;
}

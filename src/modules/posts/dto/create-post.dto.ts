import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @ApiProperty({ minLength: 1, maxLength: 200 })
  title!: string;

  @IsString()
  @MinLength(1)
  @ApiProperty()
  content!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ type: 'number', minimum: 1 })
  categoryId?: number;
}

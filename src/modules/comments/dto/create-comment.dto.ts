import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  @ApiProperty({ minLength: 1, maxLength: 2000 })
  content!: string;

  @IsInt()
  @Min(1)
  @ApiProperty({ type: 'number', minimum: 1 })
  postId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ type: 'number', minimum: 1 })
  parentId?: number;
}

import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum PostStatusFilter {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export class QueryPostsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ type: 'number', default: 1, minimum: 1 })
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({
    type: 'number',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  limit?: number = 10;

  @IsOptional()
  @IsEnum(PostStatusFilter)
  @ApiPropertyOptional({ enum: PostStatusFilter })
  status?: PostStatusFilter;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ type: 'number', minimum: 1 })
  user_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ type: 'number', minimum: 1 })
  category_id?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string' })
  keyword?: string;
}

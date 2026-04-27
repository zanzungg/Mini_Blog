import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum PostStatusFilter {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export class QueryPostsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(PostStatusFilter)
  status?: PostStatusFilter;

  @IsOptional()
  @IsInt()
  @Min(1)
  user_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  category_id?: number;

  @IsOptional()
  @IsString()
  keyword?: string;
}

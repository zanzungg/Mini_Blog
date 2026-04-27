import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryCommentsDto {
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
  @IsInt()
  @Min(1)
  post_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  user_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  parent_id?: number;

  @IsOptional()
  @IsString()
  keyword?: string;
}

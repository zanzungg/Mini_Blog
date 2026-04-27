import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  @IsInt()
  @Min(1)
  postId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  parentId?: number;
}

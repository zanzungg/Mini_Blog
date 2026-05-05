import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @ApiProperty({ minLength: 1, maxLength: 100 })
  name!: string;
}

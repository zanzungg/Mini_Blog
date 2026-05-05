import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryTopAuthorsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @ApiPropertyOptional({ type: 'number', default: 5, minimum: 1, maximum: 50 })
  limit?: number = 5;
}

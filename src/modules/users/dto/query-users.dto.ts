import { Role } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryUsersDto {
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
  @IsString()
  @ApiPropertyOptional()
  search?: string;

  @IsOptional()
  @IsEnum(Role)
  @ApiPropertyOptional({ enum: Role })
  role?: Role;
}

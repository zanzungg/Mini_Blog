import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @IsEmail()
  @ApiProperty({ format: 'email' })
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @ApiProperty({ minLength: 8, maxLength: 64 })
  password!: string;
}

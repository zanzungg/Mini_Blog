import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @IsEmail()
  @ApiProperty({ format: 'email' })
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @ApiProperty({ minLength: 8, maxLength: 64 })
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @ApiProperty({ minLength: 2, maxLength: 50 })
  name!: string;
}

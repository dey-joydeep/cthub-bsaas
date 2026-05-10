// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  // @ApiProperty({ example: 'john@doe.com' })
  @IsEmail()
  email!: string;

  // @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  // @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

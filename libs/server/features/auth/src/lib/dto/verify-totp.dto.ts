import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyTotpDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token!: string;
}

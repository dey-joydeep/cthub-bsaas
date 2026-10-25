import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateSocialDto {
  @IsString()
  @IsNotEmpty({ message: 'Platform is required' })
  platform!: string;

  @IsString()
  @IsNotEmpty({ message: 'Handle is required' })
  handle!: string;

  @IsUrl(undefined, { message: 'URL must be a valid URL' })
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}

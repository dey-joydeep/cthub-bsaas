import { IsBoolean, IsEmail, IsIn, IsISO8601, IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class CustomerInputDto {
  @IsString()
  @Length(2, 120)
  displayName!: string;

  @IsString()
  @MaxLength(30)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  dateOfBirth?: string;

  @IsOptional()
  @IsBoolean()
  consentForMarketing?: boolean;
}

export class CustomerNoteInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  @IsIn(['INTERNAL', 'STAFF_VISIBLE'])
  visibility!: 'INTERNAL' | 'STAFF_VISIBLE';
}

export class CommunicationPreferencesInputDto {
  @IsBoolean()
  smsEnabled!: boolean;

  @IsBoolean()
  emailEnabled!: boolean;

  @IsBoolean()
  whatsappEnabled!: boolean;
}

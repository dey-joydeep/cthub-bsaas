import { ApiProperty } from '@nestjs/swagger';

export class SocialResponseDto {
  constructor(data: Partial<SocialResponseDto> = {}) {
    Object.assign(this, data);
  }

  @ApiProperty({ description: 'Unique identifier of the social link' })
  id!: string;

  @ApiProperty({ description: 'User ID associated with the social link' })
  userId!: string;

  @ApiProperty({ description: 'Social media platform name' })
  platform!: string;

  @ApiProperty({ description: 'User handle on the platform' })
  handle!: string;

  @ApiProperty({ description: 'URL of the social profile', required: false })
  url?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}

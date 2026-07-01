import { IsIn, IsString, Length } from 'class-validator';

import type { SalonOwnerStatus } from '../models/salon-owner-settings.models';

const salonOwnerStatuses: readonly SalonOwnerStatus[] = ['ACTIVE', 'INACTIVE'];

export class SalonBusinessInputDto {
  @IsString()
  @Length(2, 120)
  displayName!: string;

  @IsString()
  @Length(2, 160)
  legalName!: string;

  @IsIn(salonOwnerStatuses)
  status!: SalonOwnerStatus;
}

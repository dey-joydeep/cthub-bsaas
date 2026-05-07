import { ISalonDto } from '@cthub-bsaas/shared/models/salon.dto';

export type { ISalonDto } from '@cthub-bsaas/shared/models/salon.dto';

export type Salon = ISalonDto & {
  distance?: number;
  isVerified?: boolean;
  latitude?: number;
  longitude?: number;
  location?: {
    type: string;
    coordinates: [number, number]; // [lng, lat] format
  };
};

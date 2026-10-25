export interface CreateSalonParams {
  name: string;
  address: string;
  city: string;
  zip_code?: string;
  latitude: number;
  longitude: number;
  services: string[];
  ownerId: string;
  image_url?: string;
}

export interface UpdateSalonParams {
  id: string;
  name?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  services?: string[];
  ownerId?: string;
  imageUrl?: string;
}

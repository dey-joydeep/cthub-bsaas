import { SalonServiceItem } from './salon-service-item.model';
import { Staff } from './staff.model';
export interface Review {
  id: string;
  salonId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer?: string;
}

export interface Salon {
  id: string;
  name: string;
  address: string;
  zipCode?: string;
  city?: string;
  latitude: number;
  longitude: number;
  services: SalonServiceItem[];
  staff: Staff[];
  ownerId: string;
  imagePath?: string;
  imageUrl?: string;
  images?: string[];
  reviews?: Review[];
  phone?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
}

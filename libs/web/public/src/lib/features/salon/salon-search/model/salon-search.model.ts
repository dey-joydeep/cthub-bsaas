export interface Salon {
  id: string;
  name: string;
  address: string;
  zipCode?: string;
  city?: string;
  latitude: number;
  longitude: number;
  services: any[];
  staff: any[];
  ownerId: string;
  imagePath?: string;
  imageUrl?: string;
  images?: string[];
  reviews?: any[];
  phone?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  averageRating?: number;
}

export interface SalonServiceItem {
  id: string;
  name: string;
  price: number;
  duration: number;
}

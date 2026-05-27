export interface Appointment {
  id: string;
  salonId: string;
  customerId: string;
  staffId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  status: string;
  notes: string;
}

export interface SalonServiceItem {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export interface Salon {
  id: string;
  name: string;
  address: string;
  zipCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
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

export interface Staff {
  id: string;
  name: string;
  email: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

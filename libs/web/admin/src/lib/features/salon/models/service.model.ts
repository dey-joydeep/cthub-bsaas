export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number; // in minutes
  price: number;
  category?: string;
  isActive?: boolean;
  salonId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

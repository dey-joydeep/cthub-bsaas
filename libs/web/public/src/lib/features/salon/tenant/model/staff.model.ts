export interface Staff {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
  portfolioUrl?: string; // Added missing property
  bio?: string;
  specialties?: string[];
  isActive?: boolean;
  salonId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

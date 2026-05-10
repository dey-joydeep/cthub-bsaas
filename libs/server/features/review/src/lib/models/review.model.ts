// Review model for review module

export interface Review {
  id: string;
  userId: string;
  salonId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

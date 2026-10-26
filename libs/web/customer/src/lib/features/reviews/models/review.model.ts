export interface Review {
  id: string;
  salonId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer?: string;
}

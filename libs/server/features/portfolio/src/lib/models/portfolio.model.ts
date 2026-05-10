// Portfolio model for portfolio module

export interface Portfolio {
  id: string;
  userId: string;
  images: string[];
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

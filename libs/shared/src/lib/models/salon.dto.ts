export interface ISalonDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  isOpen: boolean;
  isFeatured: boolean;
  /** @deprecated Use averageRating instead */
  rating?: number;
  averageRating: number;
  reviewCount: number;
  featuredImage: string;
  imageUrl: string;
  services: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
    description: string;
    imageUrl?: string;
  }>;
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  amenities?: string[];
  openingHours?: Array<{
    day: string;
    hours: string;
    isOpen: boolean;
  }>;
  isVerified?: boolean;
  distance?: number;
  website?: string;
  gallery: string[];
  reviews: Array<{
    id: string;
    rating: number;
    comment?: string;
    userName: string;
    userImage?: string;
    createdAt: string;
  }>;
}

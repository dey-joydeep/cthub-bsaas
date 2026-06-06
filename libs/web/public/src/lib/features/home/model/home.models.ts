/**
 * Home module data transfer objects
 * @module HomeModels
 */

export interface IServiceDto {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  categoryId?: string;
  salonId: string;
  isActive: boolean;
  isFeatured: boolean;
  imageUrl?: string;
  salon?: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

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

export interface ITestimonialDto {
  id: string;
  content: string;
  rating: number;
  author: {
    id: string;
    name: string;
    avatar?: string;
    location?: string;
  };
  salon?: {
    id: string;
    name: string;
    slug: string;
  };
  service?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface ICityDto {
  id: string;
  name: string;
  state: string;
  country: string;
  isActive: boolean;
  salonCount: number;
}

export interface IHomePageData {
  featuredSalons: ISalonDto[];
  newSalons?: ISalonDto[]; // Newly added salons
  featuredServices: IServiceDto[];
  testimonials: ITestimonialDto[];
  cities: ICityDto[];
}

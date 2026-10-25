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

import { ISalonDto } from '@cthub-bsaas/shared/models/salon.dto';

export type { ISalonDto } from '@cthub-bsaas/shared/models/salon.dto';

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

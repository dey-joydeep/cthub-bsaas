import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

// Import interfaces from the models file
import type { IHomePageData, ISalonDto, IServiceDto, ITestimonialDto, ICityDto } from '../model/home.models';
import { PublicDiscoveryApi } from '../../public-discovery/public-discovery.api';
import type { PublicPage, PublicSalonSummary, PublicService } from '../../public-discovery/public-discovery.models';

export type { IHomePageData, ISalonDto, IServiceDto, ITestimonialDto, ICityDto };

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  constructor(private readonly publicDiscovery: PublicDiscoveryApi) {}

  /**
   * Fetches all home page data in a single request
   * @returns Observable with all home page data
   */
  getHomePageData(): Observable<IHomePageData> {
    return this.publicDiscovery.getHome().pipe(
      map((home) => ({
        featuredSalons: home.featuredSalons.map((salon) => this.mapSalon(salon)),
        newSalons: home.featuredSalons.map((salon) => this.mapSalon(salon)),
        featuredServices: home.popularServices.map((service) => this.mapService(service)),
        testimonials: [],
        cities: home.nearbyAreas.map((area) => ({ id: area, name: area, state: '', country: '', isActive: true, salonCount: 0 })),
      })),
    );
  }

  /**
   * Fetches featured salons
   * @returns Observable with array of featured salons
   */
  getFeaturedSalons(): Observable<ISalonDto[]> {
    return this.publicDiscovery.searchSalons({ limit: 6 }).pipe(map((page) => page.items.map((salon) => this.mapSalon(salon))));
  }

  /**
   * Fetches featured services
   * @returns Observable with array of featured services
   */
  getFeaturedServices(): Observable<IServiceDto[]> {
    return this.publicDiscovery.getHome().pipe(map((home) => home.popularServices.map((service) => this.mapService(service))));
  }

  /**
   * Fetches testimonials
   * @returns Observable with array of testimonials
   */
  getTestimonials(): Observable<ITestimonialDto[]> {
    return new Observable<ITestimonialDto[]>((subscriber) => {
      subscriber.next([]);
      subscriber.complete();
    });
  }

  /**
   * Fetches available cities with salons
   * @returns Observable with array of cities
   */
  getCities(): Observable<ICityDto[]> {
    return this.publicDiscovery
      .getHome()
      .pipe(
        map((home) => home.nearbyAreas.map((area) => ({ id: area, name: area, state: '', country: '', isActive: true, salonCount: 0 }))),
      );
  }

  /**
   * Search salons with filters
   */
  searchSalons(query: string, filters: PublicHomeSearchFilters = {}): Observable<{ salons: ISalonDto[]; total: number }> {
    const params = new HttpParams({ fromObject: { q: query, ...filters } });
    return this.publicDiscovery
      .searchSalons({ q: params.get('q') ?? undefined, city: params.get('city') ?? undefined, limit: Number(params.get('limit') ?? 20) })
      .pipe(map((page) => ({ salons: page.items.map((salon) => this.mapSalon(salon)), total: this.estimatedTotal(page) })));
  }

  private mapSalon(salon: PublicSalonSummary): ISalonDto {
    return {
      id: salon.slug,
      name: salon.name,
      slug: salon.slug,
      description: '',
      email: '',
      phone: '',
      address: salon.area ?? '',
      city: salon.area ?? '',
      isOpen: Boolean(salon.nextAvailability),
      isFeatured: true,
      rating: Number(salon.rating),
      averageRating: Number(salon.rating),
      reviewCount: salon.reviewCount,
      featuredImage: '',
      imageUrl: '',
      services: [],
      gallery: [],
      reviews: [],
    };
  }

  private estimatedTotal<T>(page: PublicPage<T>): number {
    return page.items.length + (page.page.hasMore ? 1 : 0);
  }

  private mapService(service: PublicService): IServiceDto {
    return {
      id: service.serviceId,
      name: service.name,
      description: service.category.name,
      price: Number(service.priceFrom),
      duration: service.durationMinutes,
      categoryId: service.category.categoryId,
      salonId: '',
      isActive: service.bookable,
      isFeatured: true,
      category: {
        id: service.category.categoryId,
        name: service.category.name,
        slug: service.category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      },
    };
  }
}

export interface PublicHomeSearchFilters {
  readonly city?: string;
  readonly limit?: string | number;
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// Import environment from the correct path
import { environment } from '@cthub-bsaas/web-config';

// Import interfaces from the models file
import type { IHomePageData, ISalonDto, IServiceDto, ITestimonialDto, ICityDto } from '../model/home.models';

export type { IHomePageData, ISalonDto, IServiceDto, ITestimonialDto, ICityDto };

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  private apiUrl = `${environment.apiUrl}/home`;

  constructor(private http: HttpClient) {}

  /**
   * Fetches all home page data in a single request
   * @returns Observable with all home page data
   */
  getHomePageData(): Observable<IHomePageData> {
    return this.http.get<IHomePageData>(this.apiUrl);
  }

  /**
   * Fetches featured salons
   * @returns Observable with array of featured salons
   */
  getFeaturedSalons(): Observable<ISalonDto[]> {
    return this.http.get<ISalonDto[]>(`${this.apiUrl}/featured-salons`);
  }

  /**
   * Fetches featured services
   * @returns Observable with array of featured services
   */
  getFeaturedServices(): Observable<IServiceDto[]> {
    return this.http.get<IServiceDto[]>(`${this.apiUrl}/featured-services`);
  }

  /**
   * Fetches testimonials
   * @returns Observable with array of testimonials
   */
  getTestimonials(): Observable<ITestimonialDto[]> {
    return this.http.get<ITestimonialDto[]>(`${this.apiUrl}/testimonials`);
  }

  /**
   * Fetches available cities with salons
   * @returns Observable with array of cities
   */
  getCities(): Observable<ICityDto[]> {
    return this.http.get<ICityDto[]>(`${this.apiUrl}/cities`);
  }

  /**
   * Search salons with filters
   */
  searchSalons(query: string, filters: any = {}): Observable<any> {
    return this.http.get(`${this.apiUrl}/search`, {
      params: { q: query, ...filters },
    });
  }
}

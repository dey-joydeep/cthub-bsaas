import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';

import { HomeService } from './services/home.service';
import { TopSalonsComponent } from '../salon/top-salons/top-salons.component';
import type { IServiceDto, ITestimonialDto, ICityDto, ISalonDto, IHomePageData } from './model/home.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    DatePipe,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    TopSalonsComponent,
    MatDividerModule,
    MatButtonModule,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  loading = true;
  error: string | null = null;
  homeData: IHomePageData | null = null;
  isLoading = true; // For template loading state

  // Default values in case API doesn't return data
  featuredSalons: ISalonDto[] = [];
  newSalons: ISalonDto[] = [];
  featuredServices: IServiceDto[] = [];
  testimonials: ITestimonialDto[] = [];
  cities: ICityDto[] = [];
  searchQuery = '';
  userRole: string | null = null; // Will be set based on auth state
  specialOffers: any[] = [];
  private readonly homeService = inject(HomeService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  popularServices: IServiceDto[] = []; // Will be populated from API

  ngOnInit(): void {
    this.loadHomePageData();
  }

  get isAuthenticated(): boolean {
    // TODO: Implement actual auth check
    return false;
  }

  get primaryCtaText(): string {
    return this.isAuthenticated ? 'Book Now' : 'Sign Up';
  }

  get primaryCtaRoute(): string[] {
    return this.isAuthenticated ? ['/book'] : ['/auth/register'];
  }

  /**
   * Get an array of numbers for star rating display
   * @param rating The rating value (0-5)
   * @returns Array of numbers representing star states (1 = filled, 0.5 = half, 0 = empty)
   */
  /**
   * Get an array of numbers for star rating display
   * @param rating The rating value (0-5)
   * @returns Array of numbers representing star states (1 = filled, 0.5 = half, 0 = empty)
   */
  getRatingStars(rating: number): number[] {
    const stars: number[] = [];
    // Use bitwise OR with 0 to floor the rating
    const fullStars = rating | 0;
    const hasHalfStar = rating % 1 >= 0.5;
    // Calculate empty stars using bitwise NOT and bitwise OR
    const emptyStars = 5 - (hasHalfStar ? fullStars + 1 : fullStars);

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(1);
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(0.5);
    }

    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(0);
    }

    return stars;
  }

  /**
   * Loads the home page data from the API
   */
  private loadHomePageData(): void {
    this.loading = true;
    this.error = null;

    this.homeService.getHomePageData().subscribe({
      next: (data: IHomePageData) => {
        this.homeData = data;
        this.featuredSalons = data.featuredSalons || [];
        this.newSalons = data.newSalons || [];
        this.featuredServices = data.featuredServices || [];
        this.testimonials = data.testimonials || [];
        this.cities = data.cities || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load home page data:', err);
        this.error = 'Failed to load data. Please try again later.';
        this.loading = false;
        this.snackBar.open(this.error, 'Dismiss', { duration: 5000 });
      },
    });
  }

  private mapToSalon(salonDto: ISalonDto): ISalonDto {
    return {
      ...salonDto,
      averageRating: salonDto.averageRating ?? salonDto.rating ?? 0, // Fallback to rating if averageRating is not available
      services: salonDto.services || [],
    };
  }

  /**
   * Handles search form submission
   */
  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], {
        queryParams: { q: this.searchQuery.trim() },
      });
    }
  }

  /**
   * Gets the primary CTA route based on authentication status
   */
  getPrimaryCtaRoute(): string {
    return this.isAuthenticated ? ['/appointments'] : ['/us/salons'];
  }

  /**
   * Gets the primary CTA text based on authentication status
   */
  getPrimaryCtaText(): string {
    return this.isAuthenticated ? 'My Appointments' : 'Find a Salon';
  }

  /**
   * Shows an error message using MatSnackBar
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  // Star rating functionality is handled by getRatingStars method

  navigateToSalon(salonSlug: string): void {
    this.router.navigate(['/us', salonSlug]);
  }

  navigateToService(serviceSlug: string): void {
    this.router.navigate(['/services', serviceSlug]);
  }

  searchByCity(cityId: string): void {
    this.router.navigate(['/search'], { queryParams: { city: cityId } });
  }

  /**
   * Get star icons for rating display (compatibility method)
   * @deprecated Use getRatingStars instead
   */
  getStarIcons(rating: number): { full: number[]; half: boolean } {
    const stars = this.getRatingStars(rating);
    const fullStars = stars.filter((star) => star === 1).length;
    const hasHalfStar = stars.includes(0.5);
    return {
      full: Array(fullStars).fill(0),
      half: hasHalfStar,
    };
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  }

  /**
   * Format duration in minutes to a human-readable string (e.g., "2h 30m")
   * @param minutes Duration in minutes
   * @returns Formatted duration string
   */
  formatDuration(minutes: number): string {
    // Use bitwise OR with 0 to floor the division result
    const hours = (minutes / 60) | 0;
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`.trim();
    }
    return `${minutes}m`;
  }

  // All duplicate methods have been removed - using the implementations above
}

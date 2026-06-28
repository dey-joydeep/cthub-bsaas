import { PlatformUtils, PLATFORM_UTILS_TOKEN } from '@cthub-bsaas/web-core-platform';
import { Component, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { Salon, SalonServiceItem } from './model/salon-search.model';
import { SafeUrlPipe } from '@cthub-bsaas/web-ui';
import type { PlatformUtils } from '@cthub-bsaas/web-core-platform';

@Component({
  selector: 'app-salon-search',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe, TranslateDirective, SafeUrlPipe],
  templateUrl: './salon-search.component.html',
  styleUrls: ['./salon-search.component.css'],
})
export class SalonSearchComponent implements OnInit {
  salons: Salon[] = [];
  total = 0;
  loading = false;
  error: string | null = null;

  // Search/filter state
  query = '';
  city = '';
  zipCode = '';
  service = '';
  minRating: number | null = null;
  maxRating: number | null = null;
  page = 1;
  pageSize = 10;
  pageSizes = [10, 15, 20, 30, 40, 50];
  services: SalonServiceItem[] = [];
  sort = '';
  showMap = false;

  private readonly platformUtils = inject<PlatformUtils>(PLATFORM_UTILS_TOKEN);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  constructor(private salonService: SalonService) {}

  ngOnInit(): void {
    this.fetchServices();
    this.search();
  }

  search(resetPage = false) {
    if (resetPage) this.page = 1;
    this.loading = true;
    this.error = null;
    let params = new HttpParams().set('page', this.page).set('page_size', this.pageSize);
    if (this.query) params = params.set('name', this.query);
    if (this.city) params = params.set('city', this.city);
    if (this.zipCode) params = params.set('zip_code', this.zipCode);
    if (this.service) params = params.set('service', this.service);
    if (this.minRating !== null) params = params.set('min_rating', this.minRating);
    if (this.maxRating !== null) params = params.set('max_rating', this.maxRating);
    if (this.sort) params = params.set('sort', this.sort);
    this.salonService.searchSalons(params).subscribe({
      next: (res) => {
        this.setSalons(res.salons);
        this.total = res.total;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.userMessage || 'Failed to load salons';
        this.loading = false;
      },
    });
  }

  fetchServices() {
    this.salonService.getServices().subscribe({
      next: (services) => {
        this.services = services;
      },
      error: (err) => {
        this.services = [];
        this.error = err.userMessage || 'Failed to load services';
      },
    });
  }

  setSalons(salons: any[]): void {
    // Ensure every salon has an imagePath property (may be undefined)
    this.salons = salons.map((salon) => ({
      ...salon,
      imagePath: typeof salon.imagePath === 'string' ? salon.imagePath : undefined,
    }));
  }

  setPageSize(size: number) {
    this.pageSize = size;
    this.search(true);
  }

  goToPage(page: number) {
    this.page = page;
    this.search();
  }

  onFilterChange() {
    this.search(true);
  }

  get paginationPages(): number[] {
    return Array.from({ length: Math.ceil(this.total / this.pageSize) }, (_, i) => i + 1);
  }

  openMap(salon: Salon): void {
    const url = `https://www.google.com/maps?q=${encodeURIComponent(salon.address)}`;
    if (this.isBrowser && this.platformUtils.windowRef) {
      this.platformUtils.windowRef.open(url, '_blank');
    } else if (this.isBrowser) {
      // Fallback for browser environment if windowRef is not available
      window.open(url, '_blank');
    }
  }

  getSalonServices(salon: Salon): string {
    return Array.isArray(salon.services) ? salon.services.join(', ') : '';
  }

  onImageError(salon: Salon) {
    // Clear both possible image properties to ensure the fallback image is shown
    if ('imagePath' in salon) {
      delete (salon as any).imagePath;
    }
    if ('imageUrl' in salon) {
      delete (salon as any).imageUrl;
    }
  }

  getMapUrl(): string {
    if (!this.salons || !this.salons.length) return '';
    // Center the map on the first salon or average location
    const center = this.salons[0];
    // Markers: up to 10 salons for URL length
    const markers = this.salons
      .slice(0, 10)
      .map((salon) => `${salon.latitude},${salon.longitude}`)
      .join('|');
    // Google Maps embed with multiple markers (static map for privacy)
    return `https://www.google.com/maps/embed/v1/view?key=YOUR_GOOGLE_MAPS_API_KEY&center=${center.latitude},${center.longitude}&zoom=12&maptype=roadmap`;
    // For production, consider using a proper map component or backend-generated map with markers
  }
}

import { PlatformUtils } from '@cthub-bsaas/web-config';
import { Component, Input, OnInit, Inject, PLATFORM_ID, Type } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SalonService } from '../../services/salon.service';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ISalonDto } from '../../../home/home.models';
import type { PlatformUtils } from '@cthub-bsaas/web-config';
import { PLATFORM_UTILS_TOKEN } from '@cthub-bsaas/web-config';

// Extend ISalonDto with any additional properties needed for this component
export type Salon = ISalonDto & {
  distance?: number;
  isVerified?: boolean;
  // Add any other properties that might be needed
  latitude?: number;
  longitude?: number;
  location?: {
    type: string;
    coordinates: [number, number]; // [lng, lat] format
  };
};

@Component({
  selector: 'app-top-salons',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './top-salons.component.html',
  styleUrls: ['./top-salons.component.scss'],
  // Removed ChangeDetectionStrategy.OnPush as it requires careful state management
})
export class TopSalonsComponent implements OnInit {
  @Input() salons: Salon[] = [];
  @Input() title = 'Top Salons';
  @Input() showViewAll = false;

  loading = true;
  error: string | null = null;
  locationDenied = false;

  // Default values to prevent template errors
  defaultSalon: Partial<Salon> = {
    averageRating: 0,
    reviewCount: 0,
    address: 'Address not available',
    services: [],
  };

  isBrowser: boolean;

  constructor(
    private salonService: SalonService,
    @Inject(PLATFORM_UTILS_TOKEN) private platformUtils: PlatformUtils,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Only fetch salons if none were provided via input
    if (this.salons.length === 0) {
      if (this.isBrowser && this.platformUtils.windowRef?.navigator?.geolocation) {
        this.platformUtils.windowRef.navigator.geolocation.getCurrentPosition(
          (pos: GeolocationPosition) => {
            this.fetchTopSalons(pos.coords.latitude, pos.coords.longitude);
          },
          (err: GeolocationPositionError) => {
            this.locationDenied = true;
            this.fetchTopSalons();
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
        );
      } else {
        this.locationDenied = true;
        this.fetchTopSalons();
      }
    } else {
      this.loading = false;
    }
  }

  fetchTopSalons(lat?: number, lng?: number): void {
    this.loading = true;
    this.error = null;

    this.salonService.getTopSalons(lat, lng).subscribe({
      next: (salons: Salon[]) => {
        this.salons = salons;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to load top salons. Please try again later.';
        this.loading = false;
        console.error('Error fetching top salons:', err);
      },
    });
  }

  getMapUrl(salon: Salon): string | null {
    // Check for coordinates in the location object if available
    if (salon.location?.coordinates?.length === 2) {
      const [lng, lat] = salon.location.coordinates;
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }
    // Fallback to direct lat/lng if available (deprecated, prefer location.coordinates)
    if ((salon as any).latitude && (salon as any).longitude) {
      return `https://www.google.com/maps?q=${(salon as any).latitude},${(salon as any).longitude}`;
    }
    return null;
  }

  // Helper to safely access salon properties with defaults
  getSalonProperty(salon: Salon, prop: keyof Salon): any {
    return salon[prop] ?? this.defaultSalon[prop];
  }

  openMap(salon: Salon): void {
    if (!this.isBrowser) return;

    const url = this.getMapUrl(salon);
    if (url && this.platformUtils.windowRef) {
      this.platformUtils.windowRef.open(url, '_blank');
    }
  }
}


import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { PLATFORM_UTILS_TOKEN } from '@cthub-bsaas/web-core-platform';
import type { PlatformUtils } from '@cthub-bsaas/web-core-platform';

import type { Salon } from './model/top-salons.model';
import { TopSalonsService as SalonService } from './top-salons.service';

@Component({
  selector: 'app-top-salons',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './top-salons.component.html',
  styleUrls: ['./top-salons.component.scss'],
})
export class TopSalonsComponent implements OnInit {
  @Input() salons: Salon[] = [];
  @Input() title = 'Top Salons';
  @Input() showViewAll = false;

  loading = true;
  error: string | null = null;
  locationDenied = false;

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
    if (this.salons.length === 0) {
      if (this.isBrowser && this.platformUtils.windowRef?.navigator?.geolocation) {
        this.platformUtils.windowRef.navigator.geolocation.getCurrentPosition(
          (pos: GeolocationPosition) => {
            this.fetchTopSalons(pos.coords.latitude, pos.coords.longitude);
          },
          () => {
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
      error: (err: unknown) => {
        this.error = 'Failed to load top salons. Please try again later.';
        this.loading = false;
        console.error('Error fetching top salons:', err);
      },
    });
  }

  getMapUrl(salon: Salon): string | null {
    if (salon.location?.coordinates?.length === 2) {
      const [lng, lat] = salon.location.coordinates;
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }

    if ((salon as any).latitude && (salon as any).longitude) {
      return `https://www.google.com/maps?q=${(salon as any).latitude},${(salon as any).longitude}`;
    }

    return null;
  }

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

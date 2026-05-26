import { PLATFORM_UTILS_TOKEN } from '@cthub-bsaas/web-core-platform';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import type { PlatformUtils } from '@cthub-bsaas/web-core-platform';

import { Salon } from './model/top-salons.model';

@Component({
  selector: 'app-top-salons',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
  readonly isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_UTILS_TOKEN) private readonly platformUtils: PlatformUtils,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.locationDenied = this.salons.length === 0;
    this.loading = false;
  }

  fetchTopSalons(lat?: number, lng?: number): void {
    void lat;
    void lng;
    this.salons = [];
    this.loading = false;
  }

  getMapUrl(salon: Salon): string | null {
    if (salon.location?.coordinates?.length === 2) {
      const [lng, lat] = salon.location.coordinates;
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }
    if (salon.latitude && salon.longitude) {
      return `https://www.google.com/maps?q=${salon.latitude},${salon.longitude}`;
    }
    return null;
  }

  getSalonProperty(salon: Salon, prop: keyof Salon): Salon[keyof Salon] | undefined {
    return salon[prop] ?? this.defaultSalon[prop];
  }

  serviceNames(salon: Salon): string {
    return salon.services.map((service) => service.name).join(', ');
  }

  openMap(salon: Salon): void {
    if (!this.isBrowser) {
      return;
    }
    const url = this.getMapUrl(salon);
    if (url && this.platformUtils.windowRef) {
      this.platformUtils.windowRef.open(url, '_blank');
    }
  }
}

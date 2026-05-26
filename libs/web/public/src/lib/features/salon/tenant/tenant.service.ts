import { Injectable } from '@angular/core';
import { Observable, forkJoin, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Salon, Review, Appointment } from './model/tenant.model';
import { PublicDiscoveryApi } from '../../public-discovery/public-discovery.api';
import type { PublicReview, PublicSalonProfile, PublicService } from '../../public-discovery/public-discovery.models';

@Injectable({ providedIn: 'root' })
export class TenantService {
  constructor(private readonly publicDiscovery: PublicDiscoveryApi) {}

  getSalon(slug: string): Observable<Salon> {
    return forkJoin({
      profile: this.publicDiscovery.getSalonProfile(slug),
      services: this.publicDiscovery.listSalonServices(slug),
      reviews: this.publicDiscovery.listSalonReviews(slug),
    }).pipe(
      map(({ profile, services, reviews }) => this.mapSalon(profile, services.items, reviews.items)),
      catchError((err) => this.handleError(err)),
    );
  }

  getSalonReviews(salonId: string): Observable<Review[]> {
    return this.publicDiscovery.listSalonReviews(salonId).pipe(
      map((page) => page.items.map((review) => this.mapReview(review))),
      catchError((err) => this.handleError(err)),
    );
  }

  isEligibleForReview(userId: string, salonId: string): Observable<{ eligible: boolean }> {
    return new Observable<{ eligible: boolean }>((subscriber) => {
      subscriber.next({ eligible: Boolean(userId && salonId) });
      subscriber.complete();
    });
  }

  submitReview(salonId: string, review: { rating: number; comment: string; userId: string; }): Observable<Review> {
    return throwError(() => ({ userMessage: `Reviews are submitted after a completed booking for ${salonId}.`, review }));
  }

  submitAppointment(appointmentData: Partial<Appointment>): Observable<void> {
    return throwError(() => ({ userMessage: `Sign in to book ${appointmentData.serviceId ?? 'a service'}.` }));
  }

  private handleError(error: any) {
    let userMessage = 'An unknown error occurred.';
    if (error.status === 0) {
      userMessage = 'Network error. Please check your connection.';
    } else if (error.status === 400) {
      userMessage = error.error?.message || 'Bad request.';
    } else if (error.status === 401) {
      userMessage = 'Your session has expired. Please log in again.';
    } else if (error.status === 403) {
      userMessage = 'You do not have permission to perform this action.';
    } else if (error.status === 404) {
      userMessage = 'Requested resource not found.';
    } else if (error.status >= 500) {
      userMessage = 'A server error occurred. Please try again later.';
    }
    return throwError(() => ({ ...error, userMessage }));
  }

  private mapSalon(profile: PublicSalonProfile, services: readonly PublicService[], reviews: readonly PublicReview[]): Salon {
    const branch = profile.branches[0];
    const address = branch?.address;
    return {
      id: profile.slug,
      name: profile.name,
      address: address ? [address.line1, address.city, address.state, address.postalCode, address.country].filter(Boolean).join(', ') : '',
      city: address?.city,
      latitude: 0,
      longitude: 0,
      services: services.map((service) => ({ id: service.serviceId, name: service.name, price: Number(service.priceFrom), duration: service.durationMinutes })),
      staff: [],
      ownerId: '',
      images: profile.gallery.map((item) => item.imageUrl),
      reviews: reviews.map((review) => this.mapReview(review)),
      phone: branch?.phone ?? undefined,
      description: profile.description ?? '',
      rating: Number(profile.ratingSummary.averageRating),
      reviewCount: profile.ratingSummary.reviewCount,
    };
  }

  private mapReview(review: PublicReview): Review {
    return {
      id: review.reviewId,
      rating: review.rating,
      comment: review.comment ?? '',
      author: { id: review.reviewId, name: review.customerDisplayName },
      createdAt: review.visitedAt,
    };
  }
}

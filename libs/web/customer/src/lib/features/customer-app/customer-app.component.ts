import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject, forkJoin, takeUntil } from 'rxjs';

import { CustomerAppApi } from './customer-app.api';
import type {
  CustomerAppointment,
  CustomerBookingContext,
  CustomerDashboard,
  CustomerFavorite,
  CustomerReceipt,
  CustomerReward,
} from './customer-app.models';

type CustomerAppView = 'dashboard' | 'book' | 'appointments' | 'rewards' | 'receipts' | 'reviews';

@Component({
  selector: 'app-customer-app',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTabsModule,
  ],
  templateUrl: './customer-app.component.html',
  styleUrls: ['./customer-app.component.scss'],
})
export class CustomerAppComponent implements OnInit, OnDestroy {
  private readonly api = inject(CustomerAppApi);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  view: CustomerAppView = 'dashboard';
  loading = true;
  actionLoading = false;
  error: string | null = null;

  dashboard: CustomerDashboard | null = null;
  bookingContext: CustomerBookingContext | null = null;
  appointments: readonly CustomerAppointment[] = [];
  favorites: readonly CustomerFavorite[] = [];
  rewards: readonly CustomerReward[] = [];
  receipts: readonly CustomerReceipt[] = [];

  readonly bookingForm = this.fb.nonNullable.group({
    businessId: ['', Validators.required],
    branchId: ['', Validators.required],
    serviceIds: [[] as string[], Validators.required],
    staffId: [''],
    startAt: ['', Validators.required],
    notes: [''],
  });

  readonly reviewForm = this.fb.nonNullable.group({
    appointmentId: ['', Validators.required],
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: [''],
  });

  ngOnInit(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.view = (data['view'] as CustomerAppView | undefined) ?? 'dashboard';
    });
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.bookingForm.patchValue({
        businessId: params.get('businessId') ?? this.bookingForm.controls.businessId.value,
        branchId: params.get('branchId') ?? this.bookingForm.controls.branchId.value,
        serviceIds: params.get('serviceId') ? [params.get('serviceId') as string] : this.bookingForm.controls.serviceIds.value,
      });
      if (!this.loading) {
        this.loadBookingContext();
      }
    });
    this.loadCustomerApp();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCustomerApp(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      dashboard: this.api.getDashboard(),
      appointments: this.api.listAppointments(20),
      favorites: this.api.listFavorites(),
      rewards: this.api.listRewards(),
      receipts: this.api.listReceipts({ limit: 20 }),
    }).subscribe({
      next: ({ dashboard, appointments, favorites, rewards, receipts }) => {
        this.dashboard = dashboard;
        this.appointments = appointments.items;
        this.favorites = favorites.items;
        this.rewards = rewards.items;
        this.receipts = receipts.items;
        this.applyRecommendedSalonDefaults(dashboard);
        this.loading = false;
        this.loadBookingContext();
      },
      error: () => {
        this.error = 'Customer app data could not be loaded.';
        this.loading = false;
      },
    });
  }

  loadBookingContext(): void {
    const businessId = this.bookingForm.controls.businessId.value || undefined;
    const branchId = this.bookingForm.controls.branchId.value || undefined;
    const serviceId = this.bookingForm.controls.serviceIds.value[0];

    this.api.getBookingContext({ businessId, branchId, serviceId }).subscribe({
      next: (context) => {
        this.bookingContext = context;
        this.bookingForm.patchValue({
          businessId: context.salon.businessId,
          branchId: this.bookingForm.controls.branchId.value || context.branches[0]?.branchId || '',
          serviceIds: this.bookingForm.controls.serviceIds.value.length
            ? this.bookingForm.controls.serviceIds.value
            : context.services[0]
              ? [context.services[0].serviceId]
              : [],
        });
      },
      error: () => {
        this.bookingContext = null;
      },
    });
  }

  createBooking(): void {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }
    const value = this.bookingForm.getRawValue();
    this.actionLoading = true;
    this.api
      .createBooking({
        businessId: value.businessId,
        branchId: value.branchId,
        serviceIds: value.serviceIds,
        startAt: new Date(value.startAt).toISOString(),
        staffId: value.staffId || undefined,
        notes: value.notes || undefined,
      })
      .subscribe({
        next: (booking) => {
          this.actionLoading = false;
          this.snackBar.open(`Booking ${booking.status.toLowerCase()} for ${this.formatDateTime(booking.startAt)}.`, 'Close', {
            duration: 4000,
          });
          this.loadCustomerApp();
        },
        error: () => {
          this.actionLoading = false;
          this.snackBar.open('That time is no longer available.', 'Close', { duration: 5000 });
        },
      });
  }

  cancelAppointment(appointment: CustomerAppointment): void {
    this.actionLoading = true;
    this.api.cancelAppointment(appointment.appointmentId, { reason: 'Customer requested cancellation' }).subscribe({
      next: () => {
        this.actionLoading = false;
        this.snackBar.open('Appointment cancelled.', 'Close', { duration: 3000 });
        this.loadCustomerApp();
      },
      error: () => {
        this.actionLoading = false;
        this.snackBar.open('Appointment could not be cancelled.', 'Close', { duration: 5000 });
      },
    });
  }

  submitReview(): void {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }
    this.actionLoading = true;
    this.api.submitReview(this.reviewForm.getRawValue()).subscribe({
      next: () => {
        this.actionLoading = false;
        this.reviewForm.reset({ appointmentId: '', rating: 5, comment: '' });
        this.snackBar.open('Review submitted.', 'Close', { duration: 3000 });
      },
      error: () => {
        this.actionLoading = false;
        this.snackBar.open('Review could not be submitted.', 'Close', { duration: 5000 });
      },
    });
  }

  toggleFavorite(salon: { businessId: string; name: string }): void {
    const currentlyFavorite = this.favorites.some((favorite) => favorite.targetType === 'salon' && favorite.targetId === salon.businessId);
    this.api.upsertFavorite('salon', salon.businessId, !currentlyFavorite).subscribe({
      next: () => {
        this.snackBar.open(currentlyFavorite ? 'Removed from favorites.' : 'Added to favorites.', 'Close', { duration: 2500 });
        this.api.listFavorites().subscribe((favorites) => {
          this.favorites = favorites.items;
        });
      },
      error: () => {
        this.snackBar.open('Favorite could not be updated.', 'Close', { duration: 4000 });
      },
    });
  }

  isFavorite(salon: { businessId: string }): boolean {
    return this.favorites.some((favorite) => favorite.targetType === 'salon' && favorite.targetId === salon.businessId);
  }

  visible(section: CustomerAppView): boolean {
    return this.view === section;
  }

  formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }

  primaryServiceName(appointment: CustomerAppointment): string {
    return appointment.services[0]?.name ?? 'Service';
  }

  private applyRecommendedSalonDefaults(dashboard: CustomerDashboard): void {
    const firstSalon = dashboard.recommendedSalons[0];
    if (firstSalon && !this.bookingForm.controls.businessId.value) {
      this.bookingForm.patchValue({ businessId: firstSalon.businessId });
    }
  }
}

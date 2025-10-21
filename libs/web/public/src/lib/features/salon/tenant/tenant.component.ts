import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

// Core services
import { CurrentUserService } from '@cthub-bsaas/web-core/auth';

// Models
import { Appointment, SalonServiceItem, Salon, Staff, Review } from './model/tenant.model';
import { AppointmentStatus } from '@cthub-bsaas/shared';

// Pipes
import { SafeUrlPipe } from '@cthub-bsaas/web-ui';

// Services
import { TenantService } from './tenant.service';

@Component({
  selector: 'app-tenant',
  standalone: true,
  imports: [CommonModule, TranslateModule, SafeUrlPipe, FormsModule],
  templateUrl: './tenant.component.html',
  styleUrls: ['./tenant.component.scss'],
})
export class TenantComponent implements OnInit {
  salon: Salon | null = null;
  reviews: Review[] = [];
  eligibleToReview: boolean | null = null;
  submitting = false;
  reviewError: string | null = null;
  appointment: Partial<Appointment> = {};
  selectedDate: string = '';
  selectedTime: string = '';
  staffList: Staff[] = [];
  serviceList: SalonServiceItem[] = [];
  userId: string | null = null;

  // Component state
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private tenantService: TenantService,
    @Inject(CurrentUserService) public currentUserService: CurrentUserService,
  ) {
    // Get the current user ID
    const user = this.currentUserService.currentUser;
    this.userId = user ? user.id : null;
  }

    const salonId = this.route.snapshot.paramMap.get('tenantSlug');
    if (salonId) {
      this.tenantService.getSalon(salonId).subscribe({
        next: (salon) => {
          this.salon = salon;
          this.staffList = salon.staff || [];
          // this.serviceList = salon.services || [];
          this.fetchReviews(salonId);
        },
        error: (err) => {
          this.error = err.userMessage || 'Failed to load salon';
          this.loading = false;
        },
      });
      if (this.userId) {
        this.tenantService.isEligibleForReview(this.userId, salonId).subscribe({
          next: (res) => (this.eligibleToReview = res.eligible),
          error: (err) => {
            this.eligibleToReview = null;
            // Optionally show user-friendly error if needed
          },
        });
      }
    }
  }

  fetchReviews(salonId: string) {
    this.tenantService.getSalonReviews(salonId).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.userMessage || 'Failed to load reviews';
        this.loading = false;
      },
    });
  }

  openMap() {
    if (!this.salon) return;
    const { latitude, longitude, name } = this.salon;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}(${encodeURIComponent(name)})`;
    window.open(url, '_blank');
  }

  submitReview(rating: string, comment: string) {
    if (!this.salon?.id || !this.userId) return;

    this.submitting = true;
    this.reviewError = null;

    this.tenantService.submitReview(this.salon.id, { rating: parseInt(rating, 10), comment, userId: this.userId }).subscribe({
      next: (review) => {
        this.reviews = [review, ...this.reviews];
        this.eligibleToReview = false;
        this.submitting = false;
      },
      error: (err) => {
        this.reviewError = err.userMessage || 'Failed to submit review';
        this.submitting = false;
      },
    });
  }

  submitAppointment() {
    const salonId = this.route.snapshot.paramMap.get('tenantSlug');
    if (!salonId || !this.userId || !this.appointment.serviceId || !this.selectedDate || !this.selectedTime) {
      alert('Please fill in all appointment details.');
      return;
    }

    // Combine date and time into a single Date object for startTime
    const startTime = new Date(`${this.selectedDate}T${this.selectedTime}`);
    // Assuming a default duration of 1 hour for the appointment
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const appointmentData: Partial<Appointment> = {
      salonId,
      customerId: this.userId,
      staffId: this.appointment.staffId,
      serviceId: this.appointment.serviceId,
      startTime,
      endTime,
      status: AppointmentStatus.PENDING,
      notes: this.appointment.notes || '',
    };
    this.tenantService.submitAppointment(appointmentData).subscribe({
      next: () => {
        alert('Appointment scheduled successfully!');
      },
      error: (err) => {
        alert(err.userMessage || 'Failed to schedule appointment.');
      },
    });
  }
}
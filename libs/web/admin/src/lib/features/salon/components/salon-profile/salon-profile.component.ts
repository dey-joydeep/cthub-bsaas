import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

// Core services
import { CurrentUserService } from '../../../../core/auth/services/current-user.service';
import { ErrorService } from '@cthub-bsaas/web-core/http';

// Models from salon module
import { Appointment } from '../../models/appointment.model';
import { SalonServiceItem } from '../../models/salon-service-item.model';
import { Salon } from '../../models/salon.model';
import { Staff } from '../../models/staff.model';

// Models from other modules
import { AppointmentStatus } from '@cthub-bsaas/shared/enums/appointment-status.enum';
import { Review } from '../../../reviews/models/review.model';

// Pipes
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

// Services will be imported here when needed

// Component imports will be added here when needed

@Component({
  selector: 'app-salon-profile',
  standalone: true,
  imports: [CommonModule, HttpClientModule, TranslateModule, SafeUrlPipe, FormsModule],
  templateUrl: './salon-profile.component.html',
  styleUrls: ['./salon-profile.component.scss'],
})
export class SalonProfileComponent implements OnInit {
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
    private http: HttpClient,
    @Inject(CurrentUserService) public currentUserService: CurrentUserService,
    @Inject(ErrorService) private errorService: ErrorService,
  ) {
    // Get the current user ID
    const user = this.currentUserService.currentUser;
    this.userId = user ? user.id : null;
  }

  public ngOnInit(): void {
    const salonId = this.route.snapshot.paramMap.get('id');
    if (salonId) {
      this.http.get<Salon>(`/api/salons/${salonId}`).subscribe({
        next: (salon) => {
          this.salon = salon;
          this.staffList = salon.staff || [];
          // this.serviceList = salon.services || [];
          this.fetchReviews(salonId);
        },
        error: (err) => {
          this.error = err.error?.userMessage || err.error?.error || 'Failed to load salon';
          this.loading = false;
        },
      });
      if (this.userId) {
        this.http
          .get<{ eligible: boolean }>(`/api/user/${this.userId}/salon/${salonId}/eligible-to-review`, { withCredentials: true })
          .subscribe({
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
    this.http.get<Review[]>(`/api/salon/${salonId}/reviews`).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.userMessage || err.error?.error || 'Failed to load reviews';
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

    this.http
      .post<Review>(`/api/salon/${this.salon.id}/reviews`, {
        rating: parseInt(rating, 10),
        comment,
        userId: this.userId,
      })
      .subscribe({
        next: (review) => {
          this.reviews = [review, ...this.reviews];
          this.eligibleToReview = false;
          this.submitting = false;
        },
        error: (err) => {
          this.reviewError = err.error?.message || 'Failed to submit review';
          this.submitting = false;
        },
      });
  }

  submitAppointment() {
    const salonId = this.route.snapshot.paramMap.get('id');
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
      // startTime,
      // endTime,
      status: AppointmentStatus.PENDING,
      notes: this.appointment.notes || '',
    };
    this.http.post('/api/appointments', appointmentData).subscribe({
      next: () => {
        alert('Appointment scheduled successfully!');
      },
      error: (err) => {
        alert(err.error?.userMessage || err.error?.error || 'Failed to schedule appointment.');
      },
    });
  }
}

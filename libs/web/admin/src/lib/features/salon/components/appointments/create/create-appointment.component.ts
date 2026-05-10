import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CurrentUserService } from '../../../../../core/auth/services/current-user.service';
import { CreateAppointmentParams } from '../../../../../models/appointment-params.model';
import { Salon } from '../../../models/salon.model';
import { Service } from '../../../models/service.model';
import { Staff } from '../../../models/staff.model';

@Component({
  selector: 'app-create-appointment',
  standalone: true,
  imports: [
    // Angular modules
    CommonModule,
    ReactiveFormsModule,

    // Material modules
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,

    // Third-party modules
    TranslateModule,
  ],
  templateUrl: './create-appointment.component.html',
  styleUrls: ['./create-appointment.component.scss'],
})
export class CreateAppointmentComponent implements OnInit {
  appointmentForm: FormGroup;
  salons: Salon[] = [];
  services: Service[] = [];
  staffs: Staff[] = [];
  availableTimes: string[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;
  userId: string | null = null;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router,
    @Inject(CurrentUserService) private currentUserService: CurrentUserService,
  ) {
    this.appointmentForm = this.fb.group({
      salonId: ['', Validators.required],
      serviceId: ['', Validators.required],
      staffId: [''],
      startTime: ['', Validators.required],
      endTime: [''],
      notes: [''],
      status: ['pending'],
    });
  }

  ngOnInit() {
    this.fetchSalons();
    this.currentUserService.currentUser$.subscribe((user) => {
      this.userId = user?.id || null;
    });
  }

  fetchSalons() {
    this.http.get<any[]>('/api/salons').subscribe({
      next: (res) => {
        this.salons = res;
      },
      error: (err) => {
        this.error = err.error?.userMessage || err.error?.error || 'Failed to load salons.';
      },
    });
  }

  onSalonChange() {
    const salonId = this.appointmentForm.get('salonId')?.value;
    if (salonId) {
      this.http.get<any[]>(`/api/salons/${salonId}/services`).subscribe({
        next: (res) => {
          this.services = res;
        },
        error: (err) => {
          this.error = err.error?.userMessage || err.error?.error || 'Failed to load services.';
        },
      });
      this.http.get<any[]>(`/api/salons/${salonId}/staffs`).subscribe({
        next: (res) => {
          this.staffs = res;
        },
        error: (err) => {
          this.error = err.error?.userMessage || err.error?.error || 'Failed to load staffs.';
        },
      });
    }
  }

  onServiceChange() {
    const salonId = this.appointmentForm.get('salonId')?.value;
    const serviceId = this.appointmentForm.get('serviceId')?.value;
    if (salonId && serviceId) {
      this.http.get<string[]>(`/api/salons/${salonId}/services/${serviceId}/available-times`).subscribe({
        next: (res) => {
          this.availableTimes = res;
        },
        error: (err) => {
          this.error = err.error?.userMessage || err.error?.error || 'Failed to load available times.';
        },
      });
    }
  }

  submit() {
    if (this.appointmentForm.invalid || !this.userId) return;
    this.loading = true;
    this.error = null;
    const { salonId, serviceId, staffId, startTime, notes, status } = this.appointmentForm.value;
    if (!salonId || !serviceId || !startTime) {
      this.loading = false;
      this.error = 'Salon, service, and start time are required.';
      return;
    }

    const startDate = new Date(startTime);
    // Calculate end time (assuming 1 hour duration for now)
    const endTime = new Date(startDate.getTime() + 60 * 60 * 1000).toISOString();

    const appointment: CreateAppointmentParams = {
      customerId: this.userId,
      salonId: salonId as string,
      serviceId: serviceId as string,
      staffId: staffId as string,
      startTime: startDate.toISOString(),
      endTime: endTime,
      notes: notes as string | undefined,
    };

    this.http.post('/api/appointments', appointment).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Appointment created!';
        this.router.navigate(['/user/appointments']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.userMessage || err.error?.error || 'Failed to create appointment.';
      },
    });
  }
}

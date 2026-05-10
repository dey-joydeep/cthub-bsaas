import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CurrentUserService } from '../../../../../core/auth/services/current-user.service';
import { Appointment } from '../../../models/appointment.model';

interface AppointmentWithDetails extends Omit<Appointment, 'startTime' | 'endTime' | 'salon' | 'service' | 'staff'> {
  startTime: string | Date; // Allow both string and Date for flexibility
  endTime: string | Date; // Allow both string and Date for flexibility
  salon?: {
    id: string;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    services?: any[];
  };
  service?: {
    id: string;
    name: string;
  };
  staff?: {
    id: string;
    name: string;
  };
}

@Component({
  selector: 'app-user-appointments',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, TranslateModule],
  templateUrl: './user-appointments.component.html',
  styleUrls: ['./user-appointments.component.scss'],
})
export class UserAppointmentsComponent implements OnInit {
  appointments: AppointmentWithDetails[] = [];
  loading = true;
  error: string | null = null;
  userId: string | null = null;

  constructor(
    private http: HttpClient,
    private currentUserService: CurrentUserService,
  ) {}

  ngOnInit(): void {
    const user = this.currentUserService.currentUser;
    this.userId = user ? user.id : null;
    if (!this.userId) {
      this.error = 'You must be logged in.';
      this.loading = false;
      return;
    }
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.error = null;

    this.http.get<AppointmentWithDetails[]>(`/api/user/${this.userId}/appointments`).subscribe({
      next: (data) => {
        this.appointments = data.map((appt) => ({
          ...appt,
          // Convert string dates to Date objects if they're not already
          startTime: typeof appt.startTime === 'string' ? new Date(appt.startTime) : appt.startTime,
          endTime: typeof appt.endTime === 'string' ? new Date(appt.endTime) : appt.endTime,
          // Ensure nested objects are properly typed
          salon: appt.salon
            ? {
                id: appt.salon.id,
                name: appt.salon.name,
              }
            : undefined,
          service: appt.service
            ? {
                id: appt.service.id,
                name: appt.service.name,
              }
            : undefined,
          staff: appt.staff
            ? {
                id: appt.staff.id,
                name: appt.staff.name,
              }
            : undefined,
        }));
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load appointments';
        this.loading = false;
      },
    });
  }

  getDuration(appointment: AppointmentWithDetails): string {
    if (!appointment.startTime || !appointment.endTime) return 'N/A';

    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const diffMs = end.getTime() - start.getTime();

    if (isNaN(diffMs)) return 'N/A';

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  }
}

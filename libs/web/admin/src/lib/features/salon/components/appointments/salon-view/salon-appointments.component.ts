import { Component, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-salon-appointments',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './salon-appointments.component.html',
  styleUrls: ['./salon-appointments.component.css'],
})
export class SalonAppointmentsComponent implements OnInit {
  salonId = input<string>();
  appointments: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (!this.salonId()) {
      this.error = 'Salon ID is required.';
      this.loading = false;
      return;
    }
    this.http.get(`/api/salon/${this.salonId()}/appointments`).subscribe({
      next: (data: any) => {
        this.appointments = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.userMessage || err.error?.error || 'Failed to load appointments';
        this.loading = false;
      },
    });
  }
}

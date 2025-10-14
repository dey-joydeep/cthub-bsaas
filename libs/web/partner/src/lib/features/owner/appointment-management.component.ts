import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import { CreateAppointmentParams } from '../../models/appointment-params.model';
import { AppointmentStatus } from '@cthub-bsaas/shared/enums/appointment-status.enum';
import { AppointmentService } from './appointment.service';

@Component({
  selector: 'app-appointment-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatNativeDateModule,
    TranslateModule,
  ],
  templateUrl: './appointment-management.component.html',
  styleUrls: ['./appointment-management.component.scss'],
})
export class AppointmentManagementComponent implements OnInit {
  appointmentForm: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  statuses = Object.values(AppointmentStatus);

  // Mock data for demo purposes - in a real app, these would come from a service
  customers = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  ];

  services = [
    { id: 's1', name: 'Haircut', duration: 30 },
    { id: 's2', name: 'Coloring', duration: 120 },
  ];

  staffMembers = [
    { id: 'st1', name: 'Alex Johnson', role: 'Stylist' },
    { id: 'st2', name: 'Sam Wilson', role: 'Colorist' },
  ];

  // Current salon ID - in a real app, this would come from the auth service or route params
  private salonId = 'salon-123';

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
  ) {
    this.appointmentForm = this.fb.group({
      customerId: ['', Validators.required],
      serviceId: ['', Validators.required],
      staffId: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      notes: [''],
    });
  }

  ngOnInit(): void {
    // Set up service change handler to update end time
    this.appointmentForm.get('serviceId')?.valueChanges.subscribe((serviceId) => {
      this.updateEndTime(serviceId);
    });

    // Set up start time change handler
    this.appointmentForm.get('startTime')?.valueChanges.subscribe(() => {
      const serviceId = this.appointmentForm.get('serviceId')?.value;
      if (serviceId) {
        this.updateEndTime(serviceId);
      }
    });
  }

  private updateEndTime(serviceId: string): void {
    const service = this.services.find((s) => s.id === serviceId);
    const startTime = this.appointmentForm.get('startTime')?.value;

    if (service && startTime) {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + service.duration * 60000);
      this.appointmentForm.patchValue({
        endTime: end.toISOString(),
      });
    }
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    const formValue = this.appointmentForm.value;

    // Ensure all required fields are present and not null
    const { customerId, serviceId, staffId, startTime, endTime, notes } = formValue;

    if (!customerId || !serviceId || !staffId || !startTime || !endTime) {
      this.loading = false;
      this.error = 'All fields are required.';
      return;
    }

    const appointmentData: CreateAppointmentParams = {
      customerId,
      serviceId,
      staffId,
      salonId: this.salonId,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      notes: notes || undefined,
    };

    this.appointmentService.createAppointment(appointmentData).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.success = 'Appointment created successfully!';
          this.appointmentForm.reset();
        } else {
          this.error = res.message || 'Failed to create appointment.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'An error occurred while creating the appointment.';
      },
    });
  }
}

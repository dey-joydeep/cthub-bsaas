import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppointmentCreateService } from './appointment-create.service';
import { Service, Staff } from './models/appointment-create.model';

@Component({
  selector: 'app-appointment-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslateModule,
  ],
  templateUrl: './appointment-create.component.html',
  styleUrls: ['./appointment-create.component.scss'],
})
export class AppointmentCreateComponent implements OnInit {
  isLinear = true;
  isLoading = false;
  isSubmitting = false;
  selectedDate: Date | null = null;
  availableTimeSlots: string[] = [];

  services: Service[] = [];
  staffMembers: Staff[] = [];

  // Form groups for the stepper
  serviceFormGroup: FormGroup;
  staffFormGroup: FormGroup;
  dateTimeFormGroup: FormGroup;
  detailsFormGroup: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private appointmentCreateService: AppointmentCreateService
  ) {
    this.serviceFormGroup = this.fb.group({
      service: ['', Validators.required],
    });

    this.staffFormGroup = this.fb.group({
      staff: ['', Validators.required],
    });

    this.dateTimeFormGroup = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required],
    });

    this.detailsFormGroup = this.fb.group({
      notes: [''],
      terms: [false, Validators.requiredTrue],
    });
  }

  ngOnInit(): void {
    this.appointmentCreateService.getServices().subscribe(services => {
      this.services = services;
      // If a service ID is provided in the route, pre-select it
      const serviceId = this.route.snapshot.queryParamMap.get('serviceId');
      if (serviceId) {
        const service = this.services.find((s) => s.id === serviceId);
        if (service) {
          this.serviceFormGroup.patchValue({ service: serviceId });
          this.onServiceSelect();
        }
      }
    });

    this.appointmentCreateService.getStaff().subscribe(staff => {
      this.staffMembers = staff;
    });
  }

  onServiceSelect(): void {
    const serviceId = this.serviceFormGroup.get('service')?.value;
    if (serviceId) {
      // Filter staff members who provide this service
      this.staffFormGroup.reset();
    }
  }

  onDateSelect(): void {
    const selectedDate = this.dateTimeFormGroup.get('date')?.value;
    if (selectedDate) {
      this.selectedDate = selectedDate;
      this.generateTimeSlots();
    }
  }

  private generateTimeSlots(): void {
    // In a real app, this would come from an API based on staff availability
    this.availableTimeSlots = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM

    for (let hour = startHour; hour < endHour; hour++) {
      this.availableTimeSlots.push(`${hour}:00`, `${hour}:30`);
    }
  }

  onSubmit(): void {
    if (this.detailsFormGroup.invalid) {
      return;
    }

    this.isSubmitting = true;

    const appointment = {
      service: this.serviceFormGroup.value.service,
      staff: this.staffFormGroup.value.staff,
      date: this.dateTimeFormGroup.value.date,
      time: this.dateTimeFormGroup.value.time,
      notes: this.detailsFormGroup.value.notes,
    };

    this.appointmentCreateService.createAppointment(appointment).subscribe(() => {
      this.isSubmitting = false;
      this.snackBar.open(this.translate.instant('APPOINTMENT.CREATE_SUCCESS'), this.translate.instant('COMMON.CLOSE'), { duration: 5000 });

      // Navigate to appointment list or confirmation page
      this.router.navigate(['/appointments']);
    });
  }

  getSelectedService() {
    const serviceId = this.serviceFormGroup.get('service')?.value;
    return this.services.find((s) => s.id === serviceId);
  }

  getSelectedStaff() {
    const staffId = this.staffFormGroup.get('staff')?.value;
    return this.staffMembers.find((s) => s.id === staffId);
  }
}
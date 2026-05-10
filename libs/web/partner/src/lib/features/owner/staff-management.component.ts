import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { StaffService } from './staff.service';
import { Staff } from '../staff/models/staff.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-staff-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './staff-management.component.html',
  styleUrls: ['./staff-management.component.scss'],
})
export class StaffManagementComponent {
  staffForm;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  salonId = '';
  staffList: Staff[] = [];
  selectedStaff: Staff | null = null;

  constructor(
    private fb: FormBuilder,
    private staffService: StaffService,
    private route: ActivatedRoute,
  ) {
    this.staffForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      contact: ['', Validators.required],
      nickname: [''],
      profilePicture: [null as File | null],
    });
    // Set salonId from route params
    this.salonId = this.getSalonId();
    this.loadStaff();
  }

  getSalonId(): string {
    // Get salonId from route parameters
    return this.route.snapshot.paramMap.get('salonId') || '';
  }

  loadStaff() {
    if (!this.salonId) return;
    this.staffService.getStaffList(this.salonId).subscribe({
      next: (list) => (this.staffList = list),
      error: (err) => {
        this.error = err.userMessage || 'Failed to load staff list.';
        this.staffList = [];
      },
    });
  }

  onImageChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.staffForm.patchValue({ profilePicture: file });
      this.staffForm.get('profilePicture')?.updateValueAndValidity();
    }
  }

  onSubmit() {
    if (this.staffForm.invalid) return;
    this.loading = true;
    this.error = null;
    // Ensure all required fields are present and not null
    const { name, email, contact, nickname, profilePicture } = this.staffForm.value;
    if (!name || !email || !contact) {
      this.loading = false;
      this.error = 'All fields are required.';
      return;
    }
    const staff = {
      name: name,
      email: email,
      contact: contact,
      nickname: nickname as string,
      profilePicture: profilePicture as File | null,
    };
    const formData = new FormData();
    Object.entries(staff).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    this.staffService.addStaff(this.salonId, formData).subscribe({
      next: (staff) => {
        this.loading = false;
        this.success = 'Staff saved!';
        this.staffList.push(staff);
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.userMessage || 'Error saving staff.';
      },
    });
  }

  onActivate(staff: Staff) {
    if (!this.salonId) return;
    this.staffService.activateStaff(this.salonId, staff.id).subscribe({
      next: (updated) => {
        staff.isActive = true;
      },
      error: (err) => {
        this.error = err.userMessage || 'Error activating staff.';
      },
    });
  }

  onDeactivate(staff: Staff) {
    if (!this.salonId) return;
    this.staffService.deactivateStaff(this.salonId, staff.id).subscribe({
      next: (updated) => {
        staff.isActive = false;
      },
      error: (err) => {
        this.error = err.userMessage || 'Error deactivating staff.';
      },
    });
  }

  onRemove(staff: Staff) {
    if (!this.salonId) return;
    this.staffService.removeStaff(this.salonId, staff.id).subscribe({
      next: () => {
        this.staffList = this.staffList.filter((s) => s.id !== staff.id);
      },
      error: (err) => {
        this.error = err.userMessage || 'Error removing staff.';
      },
    });
  }
}

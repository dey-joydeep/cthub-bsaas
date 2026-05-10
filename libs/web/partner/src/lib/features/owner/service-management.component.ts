import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ServiceService } from './service.service';

@Component({
  selector: 'app-service-management',
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
  templateUrl: './service-management.component.html',
  styleUrls: ['./service-management.component.scss'],
})
export class ServiceManagementComponent {
  serviceForm;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  private currentUser: { id: string };

  constructor(
    private fb: FormBuilder,
    private serviceService: ServiceService,
  ) {
    // In a real app, you would get this from your auth service
    this.currentUser = { id: 'current-user-id' };

    this.serviceForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      duration: ['', [Validators.required, Validators.min(1)]],
      price: ['', [Validators.required, Validators.min(0)]],
      salonId: ['salon-123', Validators.required], // In a real app, this would come from the current context
    });
  }

  onSubmit() {
    if (this.serviceForm.invalid) {
      // Mark all fields as touched to show validation messages
      Object.values(this.serviceForm.controls).forEach((control) => {
        control.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = null;

    const { name, description, duration, price, salonId } = this.serviceForm.value;

    if (!name || duration === null || price === null || !salonId) {
      this.loading = false;
      this.error = 'All required fields must be filled out.';
      return;
    }

    const service = {
      name: name,
      description: (description as string) || '',
      duration: Number(duration),
      price: Number(price),
      salonId: salonId,
      createdBy: this.currentUser.id,
    };
    this.serviceService.saveService(service).subscribe({
      next: (res: { success: boolean }) => {
        this.loading = false;
        if (res.success) {
          this.success = 'Service saved!';
        } else {
          this.error = 'Failed to save service.';
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.userMessage || 'Error saving service.';
      },
    });
  }
}

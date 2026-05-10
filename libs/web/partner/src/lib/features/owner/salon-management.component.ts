import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { SalonService } from './salon.service';
import { CreateSalonParams } from '../../models/salon-params.model';
import { User } from '../../models/user.model';
import { UserRole } from '@cthub-bsaas/shared';

@Component({
  selector: 'app-salon-management',
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
    MatChipsModule,
    TranslateModule,
  ],
  templateUrl: './salon-management.component.html',
  styleUrls: ['./salon-management.component.scss'],
})
export class SalonManagementComponent {
  salonForm: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  private currentUser: User;

  availableServices: string[] = [
    'Haircut',
    'Coloring',
    'Styling',
    'Manicure',
    'Pedicure',
    'Facial',
    'Massage',
    'Waxing',
    'Makeup',
    'Other',
  ];

  constructor(
    private fb: FormBuilder,
    private salonService: SalonService,
  ) {
    // In a real app, you would get this from your auth service
    this.currentUser = {
      id: 'current-user-id',
      firstName: 'Owner',
      lastName: 'User',
      fullName: 'Owner User',
      email: 'owner@example.com',
      role: UserRole.OWNER,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.salonForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(1000)]],
      address: ['', [Validators.required, Validators.maxLength(200)]],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      state: [''],
      country: ['US', [Validators.required]],
      zipCode: ['', [Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      phone: [this.currentUser.phone || '', [Validators.required, Validators.pattern(/^[\d\s+()-]+$/)]],
      email: [this.currentUser.email, [Validators.required, Validators.email]],
      website: [''],
      timezone: [Intl.DateTimeFormat().resolvedOptions().timeZone, [Validators.required]],
      latitude: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
      services: [[], [Validators.required, Validators.minLength(1)]],
      ownerId: [this.currentUser.id, Validators.required],
      logoUrl: ['', Validators.pattern(/^https?:\/\//)],
      coverImageUrl: [''],
      isActive: [true],
      isVerified: [false],
      amenities: [[]],
      staffIds: [[]],
    });
  }

  onAddService(service: string, event: Event): void {
    event.preventDefault();
    const services = this.salonForm.get('services')?.value as string[];
    if (service && !services.includes(service)) {
      this.salonForm.get('services')?.setValue([...services, service]);
    }
  }

  onRemoveService(service: string): void {
    const services = this.salonForm.get('services')?.value as string[];
    this.salonForm.get('services')?.setValue(services.filter((s) => s !== service));
  }

  onUseCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.salonForm.patchValue({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location', error);
          this.error = 'Could not get your current location. Please enter it manually.';
        },
      );
    } else {
      this.error = 'Geolocation is not supported by this browser.';
    }
  }

  onSubmit(): void {
    if (this.salonForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    const formValue = this.salonForm.value;
    const formData: CreateSalonParams = {
      name: formValue.name,
      description: formValue.description || '',
      address: formValue.address,
      city: formValue.city,
      zipCode: formValue.zipCode,
      country: 'US', // Default value, should be configurable
      phone: this.currentUser.phone || '', // Using user's phone as default
      email: this.currentUser.email,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Default to user's timezone
      latitude: formValue.latitude,
      longitude: formValue.longitude,
      services: formValue.services || [],
      ownerId: this.currentUser.id,
      logoUrl: formValue.imageUrl,
      isActive: true,
      isVerified: false,
    };

    this.salonService.saveSalon(formData).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Salon saved successfully!';
        // Reset form but keep ownerId and set services to empty array
        this.salonForm.reset({
          ownerId: this.currentUser.id,
          services: [],
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to save salon. Please try again.';
        console.error('Error saving salon:', err);
      },
    });
  }
}

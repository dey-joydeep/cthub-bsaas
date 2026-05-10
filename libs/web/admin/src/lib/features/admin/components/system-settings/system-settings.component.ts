import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface SystemSettings {
  siteName: string;
  contactEmail: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotifications: boolean;
  defaultUserRole: string;
  sessionTimeout: number;
}

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-6">System Settings</h2>

      <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()" class="space-y-6">
        <!-- General Settings -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>General Settings</mat-card-title>
            <mat-card-subtitle>Basic system configuration</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="pt-4 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Site Name</mat-label>
                <input matInput formControlName="siteName" placeholder="Enter site name" />
                <mat-hint>The name displayed in the browser tab and emails</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Contact Email</mat-label>
                <input matInput type="email" formControlName="contactEmail" placeholder="contact@example.com" />
                <mat-hint>System notifications will be sent from this address</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Default User Role</mat-label>
                <mat-select formControlName="defaultUserRole">
                  <mat-option value="customer">Customer</mat-option>
                  <mat-option value="salon_owner">Salon Owner</mat-option>
                </mat-select>
                <mat-hint>Default role for new user registrations</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Session Timeout (minutes)</mat-label>
                <input matInput type="number" min="5" max="1440" formControlName="sessionTimeout" />
                <mat-hint>After this period of inactivity, users will be logged out</mat-hint>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Feature Flags -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Feature Flags</mat-card-title>
            <mat-card-subtitle>Enable or disable system features</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="pt-4 space-y-2">
            <mat-slide-toggle formControlName="maintenanceMode" class="block mb-4">
              Maintenance Mode
              <div class="text-sm text-gray-500 mt-1">When enabled, only administrators can access the site</div>
            </mat-slide-toggle>

            <mat-slide-toggle formControlName="registrationEnabled" class="block mb-4">
              User Registration
              <div class="text-sm text-gray-500 mt-1">Allow new users to register accounts</div>
            </mat-slide-toggle>

            <mat-slide-toggle formControlName="emailNotifications" class="block">
              Email Notifications
              <div class="text-sm text-gray-500 mt-1">Enable system-wide email notifications</div>
            </mat-slide-toggle>
          </mat-card-content>
        </mat-card>

        <!-- Danger Zone -->
        <mat-card class="border-red-100 border-2">
          <mat-card-header class="bg-red-50">
            <mat-card-title class="text-red-700">Danger Zone</mat-card-title>
            <mat-card-subtitle>Irreversible and destructive actions</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="pt-4">
            <div class="space-y-4">
              <div>
                <button type="button" mat-stroked-button color="warn" (click)="clearCache()" class="mr-4">
                  <mat-icon>cached</mat-icon>
                  Clear System Cache
                </button>
                <span class="text-sm text-gray-500">Clear all cached data (may improve performance)</span>
              </div>

              <mat-divider></mat-divider>

              <div>
                <button type="button" mat-stroked-button color="warn" (click)="resetToDefaults()" class="mr-4">
                  <mat-icon>restore</mat-icon>
                  Reset to Defaults
                </button>
                <span class="text-sm text-gray-500">Reset all settings to their default values</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Save Button -->
        <div class="flex justify-end gap-4 mt-6">
          <button type="button" mat-stroked-button (click)="discardChanges()" [disabled]="!settingsForm.dirty">Discard Changes</button>
          <button type="submit" mat-raised-button color="primary" [disabled]="!settingsForm.dirty || settingsForm.invalid">
            <mat-icon>save</mat-icon>
            Save Settings
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .mat-mdc-card {
        margin-bottom: 1.5rem;
      }

      .mat-mdc-form-field {
        width: 100%;
      }
    `,
  ],
})
export class SystemSettingsComponent {
  settingsForm: FormGroup;

  // Default values - in a real app, these would come from an API
  defaultSettings: SystemSettings = {
    siteName: 'Beauty SaaS',
    contactEmail: 'admin@beautysaas.com',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    defaultUserRole: 'customer',
    sessionTimeout: 30,
  };

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {
    this.settingsForm = this.fb.group({
      siteName: [this.defaultSettings.siteName, [Validators.required, Validators.maxLength(100)]],
      contactEmail: [this.defaultSettings.contactEmail, [Validators.required, Validators.email]],
      maintenanceMode: [this.defaultSettings.maintenanceMode],
      registrationEnabled: [this.defaultSettings.registrationEnabled],
      emailNotifications: [this.defaultSettings.emailNotifications],
      defaultUserRole: [this.defaultSettings.defaultUserRole, Validators.required],
      sessionTimeout: [this.defaultSettings.sessionTimeout, [Validators.required, Validators.min(5), Validators.max(1440)]],
    });

    // In a real app, load settings from a service
    this.loadSettings();
  }

  private loadSettings(): void {
    // In a real app, this would call a service to get settings
    // For now, we'll use the default settings
    this.settingsForm.patchValue(this.defaultSettings);
  }

  saveSettings(): void {
    if (this.settingsForm.valid) {
      const settings = this.settingsForm.value;
      console.log('Saving settings:', settings);

      // In a real app, this would call a service to save the settings
      setTimeout(() => {
        this.settingsForm.markAsPristine();
        this.showSuccess('Settings saved successfully');
      }, 1000);
    }
  }

  discardChanges(): void {
    if (confirm('Discard all changes?')) {
      this.loadSettings();
    }
  }

  clearCache(): void {
    if (confirm('Are you sure you want to clear the system cache?')) {
      console.log('Clearing system cache...');
      // In a real app, this would call a service to clear the cache
      setTimeout(() => {
        this.showSuccess('System cache cleared successfully');
      }, 1000);
    }
  }

  resetToDefaults(): void {
    if (confirm('Are you sure you want to reset all settings to their default values?')) {
      this.settingsForm.reset(this.defaultSettings);
      this.settingsForm.markAsDirty();
      this.showSuccess('Settings reset to defaults');
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['bg-green-50', 'text-green-800'],
    });
  }
}

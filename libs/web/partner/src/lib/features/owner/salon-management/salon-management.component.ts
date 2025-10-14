import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-salon-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTabsModule],
  template: `
    <div class="management-container">
      <h1>Salon Management</h1>

      <mat-tab-group>
        <mat-tab label="Details">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Salon Information</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Manage your salon details, contact information, and business hours.</p>
                <!-- Add salon form here -->
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Services">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Service Management</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Add, edit, or remove services offered by your salon.</p>
                <!-- Add services management here -->
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <mat-tab label="Gallery">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Salon Gallery</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Upload and manage photos of your salon.</p>
                <!-- Add gallery management here -->
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .management-container {
        padding: 20px;
      }

      .tab-content {
        padding: 20px 0;
      }

      mat-card {
        margin-bottom: 20px;
      }
    `,
  ],
})
export class SalonManagementComponent {}

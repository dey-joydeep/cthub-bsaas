import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <h1>Owner Dashboard</h1>

      <div class="dashboard-cards">
        <!-- Salon Management Card -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Salon Management</mat-card-title>
            <mat-card-subtitle>Manage your salon details and settings</mat-card-subtitle>
          </mat-card-header>
          <mat-card-actions>
            <button mat-button color="primary" [routerLink]="['/owner/salon']"><mat-icon>store</mat-icon> Manage Salon</button>
          </mat-card-actions>
        </mat-card>

        <!-- Appointments Card -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Appointments</mat-card-title>
            <mat-card-subtitle>View and manage appointments</mat-card-subtitle>
          </mat-card-header>
          <mat-card-actions>
            <button mat-button color="primary" [routerLink]="['/owner/appointments']"><mat-icon>event</mat-icon> View Appointments</button>
          </mat-card-actions>
        </mat-card>

        <!-- Staff Management Card -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Staff Management</mat-card-title>
            <mat-card-subtitle>Manage your staff members</mat-card-subtitle>
          </mat-card-header>
          <mat-card-actions>
            <button mat-button color="primary" [routerLink]="['/owner/staff']"><mat-icon>people</mat-icon> Manage Staff</button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 20px;
      }

      .dashboard-cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }

      .dashboard-card {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .dashboard-card mat-card-actions {
        margin-top: auto;
      }

      .dashboard-card button {
        width: 100%;
        text-align: left;
      }
    `,
  ],
})
export class OwnerDashboardComponent {}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { AppointmentManagementService } from './appointment-management.service';
import { Appointment } from './models/appointment-management.model';

@Component({
  selector: 'app-appointment-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatPaginatorModule, MatMenuModule],
  template: `
    <div class="management-container">
      <div class="header">
        <h1>Appointment Management</h1>
        <button mat-raised-button color="primary"><mat-icon>add</mat-icon> New Appointment</button>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="filters">
            <!-- Add date range picker and status filters here -->
            <button mat-button><mat-icon>filter_list</mat-icon> Filters</button>
          </div>

          <table mat-table [dataSource]="dataSource">
            <!-- Date Column -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date & Time</th>
              <td mat-cell *matCellDef="let element">{{ element.date | date: 'short' }}</td>
            </ng-container>

            <!-- Client Column -->
            <ng-container matColumnDef="client">
              <th mat-header-cell *matHeaderCellDef>Client</th>
              <td mat-cell *matCellDef="let element">{{ element.clientName }}</td>
            </ng-container>

            <!-- Service Column -->
            <ng-container matColumnDef="service">
              <th mat-header-cell *matHeaderCellDef>Service</th>
              <td mat-cell *matCellDef="let element">{{ element.serviceName }}</td>
            </ng
            <!-- Staff Column -->
            <ng-container matColumnDef="staff">
              <th mat-header-cell *matHeaderCellDef>Staff</th>
              <td mat-cell *matCellDef="let element">{{ element.staffName }}</td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let element">
                <span class="status-badge" [class]="element.status">
                  {{ element.status | titlecase }}
                </span>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let element">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item><mat-icon>visibility</mat-icon> View Details</button>
                  <button mat-menu-item><mat-icon>edit</mat-icon> Edit</button>
                  <button mat-menu-item><mat-icon>cancel</mat-icon> Cancel</button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>

          <mat-paginator [pageSizeOptions]="[5, 10, 25, 100]" aria-label="Select page of appointments"> </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .management-container {
        padding: 20px;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .filters {
        margin-bottom: 20px;
      }

      .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        text-transform: capitalize;
      }

      .status-badge.confirmed {
        background-color: #e8f5e9;
        color: #2e7d32;
      }

      .status-badge.pending {
        background-color: #fff8e1;
        color: #ff8f00;
      }

      .status-badge.cancelled {
        background-color: #ffebee;
        color: #c62828;
      }

      .status-badge.completed {
        background-color: #e3f2fd;
        color: #1565c0;
      }

      table {
        width: 100%;
      }
    `,
  ],
})
export class AppointmentManagementComponent implements OnInit {
  displayedColumns: string[] = ['date', 'client', 'service', 'staff', 'status', 'actions'];
  dataSource: Appointment[] = [];

  constructor(private appointmentManagementService: AppointmentManagementService) {}

  ngOnInit(): void {
    this.appointmentManagementService.getAppointments().subscribe((appointments) => {
      this.dataSource = appointments;
    });
  }
}
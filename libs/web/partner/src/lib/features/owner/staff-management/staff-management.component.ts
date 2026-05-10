import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { StaffFormDialogComponent } from './staff-form-dialog/staff-form-dialog.component';
import { StaffManagementService } from './staff-management.service';
import { Staff } from './models/staff-management.model';

@Component({
  selector: 'app-staff-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatMenuModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
  ],
  template: `
    <div class="management-container">
      <div class="header">
        <h1>Staff Management</h1>
        <button mat-raised-button color="primary" (click)="openAddStaffDialog()"><mat-icon>person_add</mat-icon> Add Staff</button>
      </div>

      <mat-card>
        <mat-card-content>
          <div class="filters">
            <!-- Add search and filter controls here -->
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search Staff</mat-label>
              <input matInput placeholder="Search by name or email" />
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <button mat-button><mat-icon>filter_list</mat-icon> Filters</button>
          </div>

          <table mat-table [dataSource]="dataSource">
            <!-- Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let staff">
                <div class="staff-info">
                  <div class="avatar">
                    {{ staff.name.charAt(0).toUpperCase() }}
                  </div>
                  <div class="staff-details">
                    <div class="staff-name">{{ staff.name }}</div>
                    <div class="staff-email">{{ staff.email }}</div>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Role Column -->
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Role</th>
              <td mat-cell *matCellDef="let staff">
                <span class="role-badge">{{ staff.role | titlecase }}</span>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let staff">
                <span class="status-badge" [class]="staff.status">
                  {{ staff.status | titlecase }}
                </span>
              </td>
            </ng-container>

            <!-- Last Active Column -->
            <ng-container matColumnDef="lastActive">
              <th mat-header-cell *matHeaderCellDef>Last Active</th>
              <td mat-cell *matCellDef="let staff">
                {{ staff.lastActive | date: 'short' }}
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let staff">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item><mat-icon>visibility</mat-icon> View Profile</button>
                  <button mat-menu-item (click)="editStaff(staff)"><mat-icon>edit</mat-icon> Edit</button>
                  <button mat-menu-item><mat-icon>lock_reset</mat-icon> Reset Password</button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item class="delete-action"><mat-icon>delete</mat-icon> Remove</button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>

          <mat-paginator [pageSizeOptions]="[5, 10, 25]" aria-label="Select page of staff"> </mat-paginator>
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
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
      }

      .search-field {
        width: 300px;
      }

      .staff-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #e0e0e0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 500;
      }

      .staff-details {
        line-height: 1.3;
      }

      .staff-name {
        font-weight: 500;
      }

      .staff-email {
        font-size: 12px;
        color: #666;
      }

      .role-badge {
        background-color: #e3f2fd;
        color: #1976d2;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }

      .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        text-transform: capitalize;
      }

      .status-badge.active {
        background-color: #e8f5e9;
        color: #2e7d32;
      }

      .status-badge.inactive {
        background-color: #ffebee;
        color: #c62828;
      }

      .status-badge.pending {
        background-color: #fff8e1;
        color: #ff8f00;
      }

      .delete-action {
        color: #d32f2f;
      }

      table {
        width: 100%;
      }
    `,
  ],
})
export class StaffManagementComponent implements OnInit {
  displayedColumns: string[] = ['name', 'role', 'status', 'lastActive', 'actions'];

  dataSource: Staff[] = [];

  constructor(private dialog: MatDialog, private staffManagementService: StaffManagementService) {}

  ngOnInit(): void {
    this.staffManagementService.getStaff().subscribe((staff) => {
      this.dataSource = staff;
    });
  }

  openAddStaffDialog(): void {
    const dialogRef = this.dialog.open(StaffFormDialogComponent, {
      width: '600px',
      data: { mode: 'add' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Handle the new staff member
        console.log('New staff member:', result);
      }
    });
  }

  editStaff(staff: Staff): void {
    const dialogRef = this.dialog.open(StaffFormDialogComponent, {
      width: '600px',
      data: { mode: 'edit', staff: { ...staff } },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Handle the updated staff member
        console.log('Updated staff member:', result);
      }
    });
  }
}
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  lastLogin: Date;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
  ],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-6">User Management</h2>

      <div class="mb-6">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Search Users</mat-label>
          <input matInput placeholder="Search by name or email" (keyup)="applyFilter($event)" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <div class="mat-elevation-z2 rounded-lg overflow-hidden">
        <table mat-table [dataSource]="users" matSort>
          <!-- Name Column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
            <td mat-cell *matCellDef="let user">{{ user.firstName }} {{ user.lastName }}</td>
          </ng-container>

          <!-- Email Column -->
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
            <td mat-cell *matCellDef="let user">{{ user.email }}</td>
          </ng-container>

          <!-- Role Column -->
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Role</th>
            <td mat-cell *matCellDef="let user">
              <span
                class="px-2 py-1 rounded-full text-xs"
                [ngClass]="{
                  'bg-blue-100 text-blue-800': user.role === 'admin',
                  'bg-purple-100 text-purple-800': user.role === 'salon_owner',
                  'bg-gray-100 text-gray-800': user.role === 'customer',
                }"
              >
                {{ user.role | titlecase }}
              </span>
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
            <td mat-cell *matCellDef="let user">
              <span
                class="px-2 py-1 rounded-full text-xs"
                [ngClass]="{
                  'bg-green-100 text-green-800': user.status === 'active',
                  'bg-yellow-100 text-yellow-800': user.status === 'pending',
                  'bg-red-100 text-red-800': user.status === 'suspended',
                }"
              >
                {{ user.status | titlecase }}
              </span>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      </div>
    </div>
  `,
})
export class UserManagementComponent {
  displayedColumns: string[] = ['name', 'email', 'role', 'status'];
  users: User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      status: 'active',
      lastLogin: new Date(),
    },
    {
      id: '2',
      email: 'owner@example.com',
      firstName: 'Salon',
      lastName: 'Owner',
      role: 'salon_owner',
      status: 'active',
      lastLogin: new Date(),
    },
    {
      id: '3',
      email: 'customer@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'customer',
      status: 'active',
      lastLogin: new Date(),
    },
  ];

  applyFilter(event: Event): void {
    // Implement search functionality here
    const filterValue = (event.target as HTMLInputElement).value;
    console.log('Search for:', filterValue);
  }
}

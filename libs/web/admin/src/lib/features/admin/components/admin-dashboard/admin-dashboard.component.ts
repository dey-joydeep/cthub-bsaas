import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-6">Admin Dashboard</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Stats Cards -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Total Users</mat-card-title>
            <mat-icon mat-card-avatar>people</mat-icon>
          </mat-card-header>
          <mat-card-content>
            <div class="text-3xl font-bold">{{ userCount || 0 }}</div>
            <div class="text-sm text-gray-500">Registered users</div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Pending Approvals</mat-card-title>
            <mat-icon mat-card-avatar>pending_actions</mat-icon>
          </mat-card-header>
          <mat-card-content>
            <div class="text-3xl font-bold">{{ pendingApprovals || 0 }}</div>
            <div class="text-sm text-gray-500">Salons waiting for approval</div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Active Salons</mat-card-title>
            <mat-icon mat-card-avatar>store</mat-icon>
          </mat-card-header>
          <mat-card-content>
            <div class="text-3xl font-bold">{{ activeSalons || 0 }}</div>
            <div class="text-sm text-gray-500">Active salon businesses</div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>System Status</mat-card-title>
            <mat-icon mat-card-avatar>check_circle</mat-icon>
          </mat-card-header>
          <mat-card-content>
            <div class="text-xl font-bold text-green-600">Operational</div>
            <div class="text-sm text-gray-500">All systems normal</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Recent Activity Section -->
      <div class="mt-8">
        <h3 class="text-xl font-semibold mb-4">Recent Activity</h3>
        <mat-card>
          <mat-card-content>
            <div class="space-y-4">
              <div *ngFor="let activity of recentActivities" class="flex items-start">
                <mat-icon class="mr-3 mt-1" [ngClass]="getActivityIconClass(activity.type)">
                  {{ getActivityIcon(activity.type) }}
                </mat-icon>
                <div>
                  <p class="font-medium">{{ activity.message }}</p>
                  <p class="text-sm text-gray-500">{{ activity.timestamp | date: 'medium' }}</p>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      mat-card {
        height: 100%;
        box-sizing: border-box;
      }

      .activity-icon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
      }
    `,
  ],
})
export class AdminDashboardComponent {
  // Mock data - in a real app, this would come from a service
  userCount = 0;
  pendingApprovals = 0;
  activeSalons = 0;

  recentActivities = [
    {
      type: 'user',
      message: 'New user registered: johndoe@example.com',
      timestamp: new Date(),
    },
    {
      type: 'salon',
      message: 'New salon "Beauty Paradise" submitted for approval',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      type: 'system',
      message: 'System backup completed successfully',
      timestamp: new Date(Date.now() - 86400000),
    },
  ];

  getActivityIcon(type: string): string {
    switch (type) {
      case 'user':
        return 'person_add';
      case 'salon':
        return 'store';
      case 'system':
        return 'settings';
      default:
        return 'notifications';
    }
  }

  getActivityIconClass(type: string): string {
    switch (type) {
      case 'user':
        return 'text-blue-500';
      case 'salon':
        return 'text-purple-500';
      case 'system':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipListbox } from '@angular/material/chips';

interface Salon {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: Date;
  services: string[];
  imageUrl?: string;
}

@Component({
  selector: 'app-salon-approval',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatChipsModule, MatMenuModule, MatChipListbox],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-6">Salon Approvals</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <mat-card *ngFor="let salon of salons" class="relative">
          <mat-card-header>
            <div mat-card-avatar class="bg-gray-200 rounded-full w-12 h-12 flex items-center justify-center">
              <mat-icon>store</mat-icon>
            </div>
            <mat-card-title>{{ salon.name }}</mat-card-title>
            <mat-card-subtitle>
              <span class="text-sm text-gray-500">Submitted: {{ salon.submittedDate | date: 'mediumDate' }}</span>
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content class="mt-4">
            <div class="space-y-2 text-sm">
              <div class="flex items-center">
                <mat-icon class="text-gray-500 mr-2" style="font-size: 20px; width: 20px; height: 20px;">person</mat-icon>
                <span>{{ salon.owner }}</span>
              </div>
              <div class="flex items-center">
                <mat-icon class="text-gray-500 mr-2" style="font-size: 20px; width: 20px; height: 20px;">email</mat-icon>
                <span>{{ salon.email }}</span>
              </div>
              <div class="flex items-center">
                <mat-icon class="text-gray-500 mr-2" style="font-size: 20px; width: 20px; height: 20px;">phone</mat-icon>
                <span>{{ salon.phone }}</span>
              </div>
              <div class="flex items-start">
                <mat-icon class="text-gray-500 mr-2 mt-1" style="font-size: 20px; width: 20px; height: 20px;">location_on</mat-icon>
                <span>{{ salon.address }}</span>
              </div>

              <div class="mt-3">
                <div class="text-sm font-medium text-gray-700 mb-1">Services:</div>
                <mat-chip-listbox>
                  <mat-chip-option *ngFor="let service of salon.services" [selectable]="false">
                    {{ service }}
                  </mat-chip-option>
                </mat-chip-listbox>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions class="flex justify-end gap-2 p-4">
            <button mat-stroked-button color="warn" (click)="rejectSalon(salon)">
              <mat-icon>close</mat-icon>
              Reject
            </button>
            <button mat-raised-button color="primary" (click)="approveSalon(salon)">
              <mat-icon>check</mat-icon>
              Approve
            </button>
          </mat-card-actions>

          <div class="absolute top-2 right-2">
            <span
              class="px-2 py-1 rounded-full text-xs"
              [ngClass]="{
                'bg-yellow-100 text-yellow-800': salon.status === 'pending',
                'bg-green-100 text-green-800': salon.status === 'approved',
                'bg-red-100 text-red-800': salon.status === 'rejected',
              }"
            >
              {{ salon.status | titlecase }}
            </span>
          </div>
        </mat-card>
      </div>

      <div *ngIf="salons.length === 0" class="text-center py-12 text-gray-500">
        <mat-icon class="text-4xl mb-2">check_circle_outline</mat-icon>
        <p class="text-lg">No pending salon approvals</p>
        <p class="text-sm">All salons have been reviewed.</p>
      </div>
    </div>
  `,
  styles: [
    `
      mat-card {
        transition:
          transform 0.2s,
          box-shadow 0.2s;
      }

      mat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .mat-mdc-card {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .mat-mdc-card-content {
        flex: 1;
      }
    `,
  ],
})
export class SalonApprovalComponent {
  // Mock data - replace with API call in a real app
  salons: Salon[] = [
    {
      id: '1',
      name: 'Luxury Hair Studio',
      owner: 'Jane Smith',
      email: 'jane@luxuryhairstudio.com',
      phone: '(555) 123-4567',
      address: '123 Beauty St, New York, NY 10001',
      status: 'pending',
      submittedDate: new Date('2023-05-15'),
      services: ['Haircut', 'Coloring', 'Styling', 'Extensions'],
    },
    {
      id: '2',
      name: 'Urban Nails & Spa',
      owner: 'Michael Johnson',
      email: 'mike@urbannails.com',
      phone: '(555) 234-5678',
      address: '456 Wellness Ave, Brooklyn, NY 11201',
      status: 'pending',
      submittedDate: new Date('2023-05-18'),
      services: ['Manicure', 'Pedicure', 'Nail Art', 'Spa Treatments'],
    },
    {
      id: '3',
      name: 'Glamour Beauty Lounge',
      owner: 'Sarah Williams',
      email: 'sarah@glamourbeauty.com',
      phone: '(555) 345-6789',
      address: '789 Fashion Blvd, Queens, NY 11375',
      status: 'pending',
      submittedDate: new Date('2023-05-20'),
      services: ['Makeup', 'Bridal', 'Eyelashes', 'Skincare'],
    },
  ];

  approveSalon(salon: Salon): void {
    console.log('Approving salon:', salon.name);
    // In a real app, this would call an API service
    salon.status = 'approved';
  }

  rejectSalon(salon: Salon): void {
    console.log('Rejecting salon:', salon.name);
    // In a real app, this would call an API service
    salon.status = 'rejected';
  }
}

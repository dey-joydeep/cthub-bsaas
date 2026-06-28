import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Standalone components are imported directly where needed and don't need to be declared in the module
// They are loaded via loadComponent in the routes

// Services
import { SalonService } from './services/salon.service';
import { ServiceApprovalService } from './services/service-approval.service';
import { StaffManagementService } from './services/staff-management.service';
import { StaffRequestService } from './services/staff-request.service';

// Pipes
import { SafeUrlPipe } from './pipes/safe-url.pipe';

// Routes
const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/salon-list/salon-list.component').then((m) => m.SalonListComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./components/salon-profile/salon-profile.component').then((m) => m.SalonProfileComponent),
  },
  // Add more routes as needed for other standalone components
];

@NgModule({
  declarations: [
    // No components to declare as all are standalone
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    HttpClientModule,
    // Material Modules
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSnackBarModule,
    // Import SafeUrlPipe since it's standalone
    SafeUrlPipe,
  ],
  providers: [SalonService, ServiceApprovalService, StaffManagementService, StaffRequestService],
  // No need to export SafeUrlPipe as it's standalone and can be imported directly
})
export class SalonModule {}

import { Component, OnInit, inject } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { SalonService } from './salon-list.service';
import { Salon } from './model/salon-list.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-salon-list',
  standalone: true,
  imports: [RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './salon-list.component.html',
  styleUrls: ['./salon-list.component.css'],
})
export class SalonListComponent implements OnInit {
  salons: Salon[] = [];
  loading = true;
  error: string | null = null;
  private readonly salonService = inject(SalonService);

  ngOnInit() {
    this.loadSalons();
  }

  loadSalons(): void {
    this.loading = true;
    this.salonService.getSalons().subscribe({
      next: (salons: Salon[]) => {
        this.salons = salons;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = 'Failed to load salons. Please try again later.';
        this.loading = false;
        console.error('Error loading salons:', err);
      },
    });
  }
}

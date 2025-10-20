import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { SalonService } from '../../services/salon.service';
import { Salon } from '../../models/salon.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-salon-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './salon-list.component.html',
  styleUrls: ['./salon-list.component.scss'],
})
export class SalonListComponent implements OnInit {
  salons: Salon[] = [];
  loading = true;
  error: string | null = null;

  constructor(private salonService: SalonService) {}

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

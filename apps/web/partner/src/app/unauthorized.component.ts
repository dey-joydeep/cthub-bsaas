import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule],
  template: `
    <div style="display: flex; justify-content: center; align-items: center; min-height: 60vh; padding: 24px;">
      <mat-card style="max-width: 480px; text-align: center; padding: 32px;">
        <mat-card-header style="justify-content: center;">
          <mat-card-title>Access Restricted</mat-card-title>
        </mat-card-header>
        <mat-card-content style="margin: 16px 0;">
          <p>You do not have branch manager permissions to view this section.</p>
        </mat-card-content>
        <mat-card-actions style="justify-content: center;">
          <a mat-button routerLink="/auth">Return to Home</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
})
export class UnauthorizedComponent {}

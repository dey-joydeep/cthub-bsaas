import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'admin-service-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="feature-placeholder">
      <h1>Global Service Management</h1>
      <p>Administrative tooling for shared services will be surfaced here.</p>
    </section>
  `,
  styles: [
    `
      .feature-placeholder {
        padding: 2rem;
      }

      h1 {
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class ServiceManagementComponent {}

import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'admin-service-management',
  standalone: true,
  imports: [],
  template: `
    <section class="feature-placeholder">
      <h1>Global Service Management</h1>
      <p>Administrative tooling for shared services will be surfaced here.</p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
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

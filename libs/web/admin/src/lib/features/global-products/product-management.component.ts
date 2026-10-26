import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'admin-product-management',
  standalone: true,
  imports: [],
  template: `
    <section class="feature-placeholder">
      <h1>Global Product Management</h1>
      <p>This section is under construction. Product administration tooling will be configured here.</p>
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
export class ProductManagementComponent {}

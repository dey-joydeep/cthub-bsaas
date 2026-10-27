import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'admin-subscriptions',
  standalone: true,
  imports: [],
  template: `
    <section class="feature-placeholder">
      <h1>Subscriber Overview</h1>
      <p>Reporting for subscribers will appear here once implemented.</p>
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
export class SubscriptionsComponent {}

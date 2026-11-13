import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateRangeFormat, DateRangePipe } from '../pipes/date-range.pipe';

@Component({
  selector: 'lib-date-range',
  standalone: true,
  imports: [CommonModule, DateRangePipe],
  template: `
    @if (start()) {
      <time [attr.datetime]="startIso()" class="lib-date-range">
        {{ [start(), end()] | dateRange: format() : separator() }}
      </time>
    }
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
      }
      .lib-date-range {
        font-variant-numeric: tabular-nums;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeComponent {
  readonly start = input<string | Date | number | null | undefined>();
  readonly end = input<string | Date | number | null | undefined>();
  readonly format = input<DateRangeFormat>('short');
  readonly separator = input<string>(' – ');

  protected readonly startIso = computed(() => {
    const s = this.start();
    if (!s) {
      return undefined;
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  });
}

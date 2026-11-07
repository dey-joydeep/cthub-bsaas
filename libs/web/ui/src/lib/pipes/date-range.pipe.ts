import { Pipe, PipeTransform, inject, LOCALE_ID } from '@angular/core';

export type DateRangeFormat = 'short' | 'medium' | 'dateOnly' | 'timeOnly';

export interface DateRangeInput {
  readonly start?: string | Date | number | null | undefined;
  readonly end?: string | Date | number | null | undefined;
}

@Pipe({
  name: 'dateRange',
  standalone: true,
})
export class DateRangePipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID, { optional: true }) ?? 'en-US';

  transform(
    value:
      DateRangeInput | readonly [string | Date | number | null | undefined, string | Date | number | null | undefined] | null | undefined,
    format: DateRangeFormat = 'short',
    separator = ' – ',
  ): string {
    if (!value) {
      return '';
    }

    let startVal: string | Date | number | null | undefined;
    let endVal: string | Date | number | null | undefined;

    if (Array.isArray(value)) {
      const tuple = value as readonly (string | Date | number | null | undefined)[];
      startVal = tuple[0];
      endVal = tuple[1];
    } else {
      const input = value as DateRangeInput;
      startVal = input.start;
      endVal = input.end;
    }

    const start = this.parseDate(startVal);
    const end = this.parseDate(endVal);

    if (!start && !end) {
      return '';
    }
    if (start && !end) {
      return this.formatSingle(start, format);
    }
    if (!start && end) {
      return this.formatSingle(end, format);
    }

    return this.formatRange(start!, end!, format, separator);
  }

  private parseDate(val: string | Date | number | null | undefined): Date | null {
    if (val === null || val === undefined || val === '') {
      return null;
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  private formatSingle(date: Date, format: DateRangeFormat): string {
    const options = this.getFormatOptions(format);
    return new Intl.DateTimeFormat(this.locale, options).format(date);
  }

  private formatRange(start: Date, end: Date, format: DateRangeFormat, separator: string): string {
    const isSameDay = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth() && start.getDate() === end.getDate();

    if (format === 'dateOnly') {
      const dateOpts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };
      if (isSameDay) {
        return new Intl.DateTimeFormat(this.locale, dateOpts).format(start);
      }
      return `${new Intl.DateTimeFormat(this.locale, dateOpts).format(start)}${separator}${new Intl.DateTimeFormat(this.locale, dateOpts).format(end)}`;
    }

    if (format === 'timeOnly') {
      const timeOpts: Intl.DateTimeFormatOptions = { timeStyle: 'short' };
      return `${new Intl.DateTimeFormat(this.locale, timeOpts).format(start)}${separator}${new Intl.DateTimeFormat(this.locale, timeOpts).format(end)}`;
    }

    // Standard short or medium format
    if (isSameDay) {
      // Smart same-day formatting: e.g. "Nov 10, 2026, 9:00 AM – 5:00 PM"
      const dateOpts: Intl.DateTimeFormatOptions = format === 'medium' ? { dateStyle: 'medium' } : { dateStyle: 'short' };
      const timeOpts: Intl.DateTimeFormatOptions = { timeStyle: 'short' };

      const datePart = new Intl.DateTimeFormat(this.locale, dateOpts).format(start);
      const startTimePart = new Intl.DateTimeFormat(this.locale, timeOpts).format(start);
      const endTimePart = new Intl.DateTimeFormat(this.locale, timeOpts).format(end);

      return `${datePart}, ${startTimePart}${separator}${endTimePart}`;
    }

    // Multi-day range: full date-time for both boundaries
    const fullOpts: Intl.DateTimeFormatOptions =
      format === 'medium' ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'short', timeStyle: 'short' };

    const startFormatted = new Intl.DateTimeFormat(this.locale, fullOpts).format(start);
    const endFormatted = new Intl.DateTimeFormat(this.locale, fullOpts).format(end);

    return `${startFormatted}${separator}${endFormatted}`;
  }

  private getFormatOptions(format: DateRangeFormat): Intl.DateTimeFormatOptions {
    switch (format) {
      case 'dateOnly':
        return { dateStyle: 'medium' };
      case 'timeOnly':
        return { timeStyle: 'short' };
      case 'medium':
        return { dateStyle: 'medium', timeStyle: 'short' };
      case 'short':
      default:
        return { dateStyle: 'short', timeStyle: 'short' };
    }
  }
}

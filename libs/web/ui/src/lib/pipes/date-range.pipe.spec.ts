import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { DateRangePipe } from './date-range.pipe';

describe('DateRangePipe', () => {
  let pipe: DateRangePipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DateRangePipe, { provide: LOCALE_ID, useValue: 'en-US' }],
    });
    pipe = TestBed.inject(DateRangePipe);
  });

  it('returns empty string for null or undefined value', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform([null, null])).toBe('');
  });

  it('formats single date when end is missing', () => {
    const start = new Date(2026, 10, 10, 9, 30);
    const result = pipe.transform([start, null]);
    expect(result).toContain('11/10/26');
    expect(result).toContain('9:30');
  });

  it('formats single date when start is missing', () => {
    const end = new Date(2026, 10, 10, 17, 0);
    const result = pipe.transform([null, end]);
    expect(result).toContain('11/10/26');
    expect(result).toContain('5:00');
  });

  it('smart-formats same-day ranges without repeating the date', () => {
    const start = new Date(2026, 10, 10, 9, 0);
    const end = new Date(2026, 10, 10, 17, 30);
    const result = pipe.transform([start, end]);

    // Should contain date once and both times
    expect(result).toContain('11/10/26');
    expect(result).toContain('9:00');
    expect(result).toContain('5:30');
    // Ensure date "11/10/26" appears only once in the same-day output
    const matches = result.match(/11\/10\/26/g);
    expect(matches?.length).toBe(1);
  });

  it('formats multi-day ranges with both date boundaries', () => {
    const start = new Date(2026, 10, 10, 9, 0);
    const end = new Date(2026, 10, 12, 18, 0);
    const result = pipe.transform([start, end]);

    expect(result).toContain('11/10/26');
    expect(result).toContain('11/12/26');
  });

  it('supports DateRangeInput object format', () => {
    const result = pipe.transform({
      start: new Date(2026, 10, 10, 9, 0),
      end: new Date(2026, 10, 10, 17, 0),
    });

    expect(result).toContain('11/10/26');
    expect(result).toContain('9:00');
    expect(result).toContain('5:00');
  });

  it('supports dateOnly format', () => {
    const start = new Date(2026, 10, 10, 9, 0);
    const end = new Date(2026, 10, 12, 18, 0);
    const result = pipe.transform([start, end], 'dateOnly');

    expect(result).toContain('Nov 10, 2026');
    expect(result).toContain('Nov 12, 2026');
    expect(result).not.toContain('9:00');
  });

  it('supports timeOnly format', () => {
    const start = new Date(2026, 10, 10, 9, 0);
    const end = new Date(2026, 10, 10, 17, 0);
    const result = pipe.transform([start, end], 'timeOnly');

    expect(result).toContain('9:00');
    expect(result).toContain('5:00');
    expect(result).not.toContain('11/10/26');
  });

  it('handles ISO string inputs seamlessly', () => {
    const result = pipe.transform(['2026-11-10T09:00:00.000Z', '2026-11-10T17:00:00.000Z']);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('–');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { DateRangeComponent } from './date-range.component';

describe('DateRangeComponent', () => {
  let fixture: ComponentFixture<DateRangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateRangeComponent],
      providers: [{ provide: LOCALE_ID, useValue: 'en-US' }],
    }).compileComponents();

    fixture = TestBed.createComponent(DateRangeComponent);
  });

  it('renders time element with formatted date range', () => {
    fixture.componentRef.setInput('start', '2026-11-10T09:00:00.000Z');
    fixture.componentRef.setInput('end', '2026-11-10T17:00:00.000Z');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const timeEl = root.querySelector('time');
    expect(timeEl).toBeTruthy();
    expect(timeEl?.getAttribute('datetime')).toContain('2026-11-10');
    expect(timeEl?.textContent).toContain('–');
  });

  it('renders nothing when start is undefined', () => {
    fixture.componentRef.setInput('start', undefined);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const timeEl = root.querySelector('time');
    expect(timeEl).toBeNull();
  });
});

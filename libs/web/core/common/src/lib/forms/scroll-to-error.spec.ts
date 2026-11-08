import { describe, expect, it, vi } from 'vitest';
import { scrollToFirstInvalidControl } from './scroll-to-error';

describe('scrollToFirstInvalidControl', () => {
  it('returns false when no invalid controls are found', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="mat-form-field ng-valid">
        <input class="ng-valid" />
      </div>
    `;
    const result = scrollToFirstInvalidControl(container);
    expect(result).toBe(false);
  });

  it('scrolls and focuses the first invalid element', () => {
    const container = document.createElement('div');
    const scrollIntoViewMock = vi.fn();
    const focusMock = vi.fn();

    container.innerHTML = `
      <div class="mat-form-field ng-valid">
        <input class="ng-valid" />
      </div>
      <div class="mat-form-field ng-invalid">
        <input class="ng-invalid" />
      </div>
    `;

    const invalidField = container.querySelector('.mat-form-field.ng-invalid') as HTMLElement;
    invalidField.scrollIntoView = scrollIntoViewMock;
    const input = invalidField.querySelector('input') as HTMLElement;
    input.focus = focusMock;

    const result = scrollToFirstInvalidControl(container);

    expect(result).toBe(true);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(focusMock).toHaveBeenCalled();
  });

  it('detects aria-invalid="true" controls', () => {
    const container = document.createElement('div');
    const scrollIntoViewMock = vi.fn();
    const focusMock = vi.fn();

    container.innerHTML = `
      <div>
        <input aria-invalid="true" />
      </div>
    `;

    const input = container.querySelector('input[aria-invalid="true"]') as HTMLElement;
    input.scrollIntoView = scrollIntoViewMock;
    input.focus = focusMock;

    const result = scrollToFirstInvalidControl(container);

    expect(result).toBe(true);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(focusMock).toHaveBeenCalled();
  });
});

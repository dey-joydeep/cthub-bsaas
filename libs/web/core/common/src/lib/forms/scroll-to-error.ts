/**
 * Automatically scrolls the first invalid form control into view and focuses it.
 * Solves the issue where form validation errors are placed out-of-view after user scrolling.
 *
 * @param container Optional container element or document to search within. Defaults to global document.
 * @returns true if an invalid element was found and scrolled into view, false otherwise.
 */
export function scrollToFirstInvalidControl(container?: Element | Document): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  const root = container ?? document;
  const invalidElement = root.querySelector<HTMLElement>(
    '.mat-mdc-form-field.ng-invalid, .mat-form-field.ng-invalid, [aria-invalid="true"], input.ng-invalid, select.ng-invalid, textarea.ng-invalid',
  );

  if (!invalidElement) {
    return false;
  }

  if (typeof invalidElement.scrollIntoView === 'function') {
    invalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const focusable = invalidElement.querySelector<HTMLElement>('input, select, textarea, button, [tabindex="0"]') ?? invalidElement;
  if (typeof focusable.focus === 'function') {
    try {
      focusable.focus({ preventScroll: true });
    } catch {
      focusable.focus();
    }
  }

  return true;
}

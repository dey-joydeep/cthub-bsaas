import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Standard phone number pattern.
 * Allows optional leading +, groups of digits separated by hyphens/spaces/dots or parens, ending in a digit.
 */
export const PHONE_NUMBER_PATTERN = /^(?:\+?\d{1,4}[-.\s]*)?(?:\(\d{1,4}\)[-.\s]*)?(?:\d{1,4}[-.\s]*)*\d{2,6}$/;

/**
 * Validates international and domestic phone numbers.
 * - Allows null, undefined, or empty string (use Validators.required for mandatory fields).
 * - Enforces valid format without trailing hyphens or invalid characters.
 * - Enforces minimum 9 and maximum 15 digits per ITU-T E.164 standards.
 *
 * @returns ValidationErrors with { pattern: true } if invalid, or null if valid.
 */
export function phoneNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }
    if (typeof value !== 'string') {
      return { pattern: true };
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    if (!PHONE_NUMBER_PATTERN.test(trimmed)) {
      return { pattern: true };
    }
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) {
      return { pattern: true };
    }
    return null;
  };
}

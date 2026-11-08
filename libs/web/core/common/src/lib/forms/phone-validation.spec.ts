import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { PHONE_NUMBER_PATTERN, phoneNumberValidator } from './phone-validation';

describe('phoneNumberValidator', () => {
  const validator = phoneNumberValidator();

  it('allows empty, null, or undefined values (leaving required checks to Validators.required)', () => {
    expect(validator(new FormControl(''))).toBeNull();
    expect(validator(new FormControl(null))).toBeNull();
    expect(validator(new FormControl(undefined))).toBeNull();
    expect(validator(new FormControl('   '))).toBeNull();
  });

  it('validates Japanese international formatted numbers (+81-90-XXXX-XXXX)', () => {
    expect(validator(new FormControl('+81-90-1111-2222'))).toBeNull();
    expect(validator(new FormControl('+81-3-5555-0101'))).toBeNull();
    expect(validator(new FormControl('+81 90 1234 5678'))).toBeNull();
  });

  it('validates Japanese domestic numbers (090-XXXX-XXXX, 03-XXXX-XXXX, 09000000001)', () => {
    expect(validator(new FormControl('090-1234-5678'))).toBeNull();
    expect(validator(new FormControl('03-1234-5678'))).toBeNull();
    expect(validator(new FormControl('09000000001'))).toBeNull();
    expect(validator(new FormControl('0120-123-456'))).toBeNull();
  });

  it('validates US/International numbers', () => {
    expect(validator(new FormControl('+1-555-123-4567'))).toBeNull();
    expect(validator(new FormControl('(555) 123-4567'))).toBeNull();
    expect(validator(new FormControl('123-456-7890'))).toBeNull();
    expect(validator(new FormControl('+819012345678'))).toBeNull();
  });

  it('rejects dangling hyphens and incomplete phone numbers like "+81-90-"', () => {
    expect(validator(new FormControl('+81-90-'))).toEqual({ pattern: true });
    expect(validator(new FormControl('+81-'))).toEqual({ pattern: true });
    expect(validator(new FormControl('+81-90-1234-'))).toEqual({ pattern: true });
    expect(validator(new FormControl('090-'))).toEqual({ pattern: true });
  });

  it('rejects numbers with too few digits (under 9 digits)', () => {
    expect(validator(new FormControl('123'))).toEqual({ pattern: true });
    expect(validator(new FormControl('1234567'))).toEqual({ pattern: true });
    expect(validator(new FormControl('+81-90-123'))).toEqual({ pattern: true });
    expect(validator(new FormControl('+81-90-1234'))).toEqual({ pattern: true });
  });

  it('rejects non-numeric or malformed values', () => {
    expect(validator(new FormControl('abc'))).toEqual({ pattern: true });
    expect(validator(new FormControl('phone12345678'))).toEqual({ pattern: true });
    expect(validator(new FormControl(123456789 as unknown as string))).toEqual({ pattern: true });
  });

  it('validates PHONE_NUMBER_PATTERN constant', () => {
    expect(PHONE_NUMBER_PATTERN.test('+81-90-1111-2222')).toBe(true);
    expect(PHONE_NUMBER_PATTERN.test('+81-90-')).toBe(false);
  });
});

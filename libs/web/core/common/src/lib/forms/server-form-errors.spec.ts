import { FormControl, FormGroup, Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import { applyServerValidationErrors, clearServerValidationErrors } from './server-form-errors';

describe('server-form-errors', () => {
  it('maps structured errors to matching form controls and marks them touched', () => {
    const form = new FormGroup({
      email: new FormControl('', Validators.required),
      phone: new FormControl(''),
    });

    const serverError = {
      status: 422,
      error: {
        message: 'Validation failed for staff creation',
        errors: [
          { field: 'email', message: 'Email is already registered.' },
          { field: 'phone', message: 'Phone number format is invalid.' },
        ],
      },
    };

    const bannerMessage = applyServerValidationErrors(form, serverError);

    expect(bannerMessage).toBe('Validation failed for staff creation');
    expect(form.controls.email.hasError('serverError')).toBe(true);
    expect(form.controls.email.getError('serverError')).toBe('Email is already registered.');
    expect(form.controls.email.touched).toBe(true);

    expect(form.controls.phone.hasError('serverError')).toBe(true);
    expect(form.controls.phone.getError('serverError')).toBe('Phone number format is invalid.');
    expect(form.controls.phone.touched).toBe(true);
  });

  it('maps RFC 7807 invalidParams to matching controls', () => {
    const form = new FormGroup({
      duration: new FormControl(0),
    });

    const rfcError = {
      status: 422,
      error: {
        message: 'Invalid service parameters',
        invalidParams: [{ name: 'duration', reason: 'Duration must be at least 5 minutes.' }],
      },
    };

    const bannerMessage = applyServerValidationErrors(form, rfcError);

    expect(bannerMessage).toBe('Invalid service parameters');
    expect(form.controls.duration.hasError('serverError')).toBe(true);
    expect(form.controls.duration.getError('serverError')).toBe('Duration must be at least 5 minutes.');
  });

  it('preserves existing client validation errors while adding serverError', () => {
    const form = new FormGroup({
      email: new FormControl('', Validators.required),
    });

    // Form control already has client-side 'required' error
    form.controls.email.updateValueAndValidity();
    expect(form.controls.email.hasError('required')).toBe(true);

    applyServerValidationErrors(form, {
      error: {
        errors: [{ field: 'email', message: 'Email domain is blacklisted.' }],
      },
    });

    expect(form.controls.email.hasError('required')).toBe(true);
    expect(form.controls.email.hasError('serverError')).toBe(true);
  });

  it('recursively clears serverError without removing client validation errors', () => {
    const form = new FormGroup({
      email: new FormControl('', Validators.required),
      phone: new FormControl('09012345678'),
    });

    form.controls.email.updateValueAndValidity();
    applyServerValidationErrors(form, {
      error: {
        errors: [
          { field: 'email', message: 'Server error on email' },
          { field: 'phone', message: 'Server error on phone' },
        ],
      },
    });

    expect(form.controls.email.hasError('serverError')).toBe(true);
    expect(form.controls.phone.hasError('serverError')).toBe(true);

    clearServerValidationErrors(form);

    expect(form.controls.email.hasError('serverError')).toBe(false);
    expect(form.controls.email.hasError('required')).toBe(true); // preserved!
    expect(form.controls.phone.hasError('serverError')).toBe(false);
    expect(form.controls.phone.errors).toBeNull();
  });

  it('safely handles non-object errors or errors missing field details', () => {
    const form = new FormGroup({
      email: new FormControl(''),
    });

    const fallback = applyServerValidationErrors(form, null, 'Custom fallback message');
    expect(fallback).toBe('Custom fallback message');
    expect(form.controls.email.errors).toBeNull();
  });
});

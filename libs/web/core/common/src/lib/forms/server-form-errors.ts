import { AbstractControl, FormArray, FormGroup } from '@angular/forms';

export interface FieldValidationError {
  readonly field: string;
  readonly message: string;
}

export interface StructuredServerValidationError {
  readonly message?: string;
  readonly errors?: readonly FieldValidationError[];
  readonly invalidParams?: readonly { name: string; reason: string }[];
}

/**
 * Parses an unknown HTTP error response and maps field-level validation errors
 * directly onto matching Angular FormControls, while returning the top-level error message.
 *
 * @param form The target FormGroup or FormArray
 * @param error The raw error caught from an HTTP request
 * @param fallbackMessage Fallback banner message if the server does not supply one
 * @returns The resolved top-level error message suitable for a page alert banner
 */
export function applyServerValidationErrors(
  form: AbstractControl,
  error: unknown,
  fallbackMessage = 'Please correct the highlighted fields before saving.',
): string {
  const payload = extractErrorPayload(error);
  const fieldErrors = extractFieldValidationErrors(payload);

  if (fieldErrors.length > 0) {
    for (const { field, message } of fieldErrors) {
      const control = form.get(field);
      if (control) {
        const existingErrors = control.errors ?? {};
        control.setErrors({ ...existingErrors, serverError: message });
        control.markAsTouched();
      }
    }
  }

  return payload?.message || (typeof error === 'string' ? error : fallbackMessage);
}

/**
 * Recursively clears any previously assigned `serverError` keys from all controls
 * in a FormGroup or FormArray without clearing client-side validator states.
 */
export function clearServerValidationErrors(control: AbstractControl): void {
  if (control instanceof FormGroup) {
    for (const key of Object.keys(control.controls)) {
      clearServerValidationErrors(control.controls[key]);
    }
  } else if (control instanceof FormArray) {
    for (const child of control.controls) {
      clearServerValidationErrors(child);
    }
  } else {
    if (control.errors && control.errors['serverError']) {
      const { serverError: _, ...remainingErrors } = control.errors;
      const nextErrors = Object.keys(remainingErrors).length > 0 ? remainingErrors : null;
      control.setErrors(nextErrors);
    }
  }
}

function extractErrorPayload(error: unknown): StructuredServerValidationError | null {
  if (!error || typeof error !== 'object') {
    return null;
  }
  const errObj = error as { error?: unknown; message?: string };
  if (errObj.error && typeof errObj.error === 'object') {
    return errObj.error as StructuredServerValidationError;
  }
  return error as StructuredServerValidationError;
}

function extractFieldValidationErrors(payload: StructuredServerValidationError | null): FieldValidationError[] {
  if (!payload) {
    return [];
  }

  const results: FieldValidationError[] = [];

  // Standard backend format: { errors: [{ field, message }] }
  if (Array.isArray(payload.errors)) {
    for (const item of payload.errors) {
      if (item && typeof item.field === 'string' && typeof item.message === 'string') {
        results.push({ field: item.field, message: item.message });
      }
    }
  }

  // RFC 7807 problem details: { invalidParams: [{ name, reason }] }
  if (Array.isArray(payload.invalidParams)) {
    for (const item of payload.invalidParams) {
      if (item && typeof item.name === 'string' && typeof item.reason === 'string') {
        results.push({ field: item.name, message: item.reason });
      }
    }
  }

  return results;
}

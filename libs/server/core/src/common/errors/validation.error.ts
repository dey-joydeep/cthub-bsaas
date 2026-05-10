export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ValidationError';
    // This is needed to restore the prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class LastAdminValidationError extends ValidationError {
  constructor(message: string, details?: unknown) {
    super(message, 'LAST_ADMIN_VALIDATION_ERROR', details);
    this.name = 'LastAdminValidationError';
  }
}

export class DatabaseValidationError extends ValidationError {
  constructor(message: string, details?: unknown) {
    super(message, 'DATABASE_VALIDATION_ERROR', details);
    this.name = 'DatabaseValidationError';
  }
}

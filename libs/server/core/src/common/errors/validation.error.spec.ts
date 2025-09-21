import { ValidationError, LastAdminValidationError, DatabaseValidationError } from './validation.error';

describe('Validation Error Classes', () => {
  it('should correctly instantiate ValidationError', () => {
    const error = new ValidationError('Test Message', 'TEST_CODE', { detail: 1 });
    expect(error.message).toBe('Test Message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toEqual({ detail: 1 });
    expect(error.name).toBe('ValidationError');
  });

  it('should correctly instantiate LastAdminValidationError', () => {
    const error = new LastAdminValidationError('Last admin');
    expect(error.message).toBe('Last admin');
    expect(error.code).toBe('LAST_ADMIN_VALIDATION_ERROR');
    expect(error.name).toBe('LastAdminValidationError');
  });

  it('should correctly instantiate DatabaseValidationError', () => {
    const error = new DatabaseValidationError('DB error');
    expect(error.message).toBe('DB error');
    expect(error.code).toBe('DATABASE_VALIDATION_ERROR');
    expect(error.name).toBe('DatabaseValidationError');
  });
});

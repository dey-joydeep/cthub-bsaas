import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
  ServiceUnavailableError,
} from './http-errors';

describe('HTTP Error Classes', () => {
  it('should correctly instantiate BadRequestError', () => {
    const error = new BadRequestError('Test Message');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.message).toBe('Test Message');
  });

  it('should correctly instantiate UnauthorizedError', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.message).toBe('Unauthorized');
  });

  it('should correctly instantiate ForbiddenError', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
    expect(error.message).toBe('Forbidden');
  });

  it('should correctly instantiate NotFoundError', () => {
    const error = new NotFoundError('User');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('User not found');
  });

  it('should correctly instantiate ConflictError', () => {
    const error = new ConflictError();
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(error.message).toBe('Conflict');
  });

  it('should correctly instantiate ValidationError', () => {
    const errors = { email: ['is invalid'] };
    const error = new ValidationError(errors);
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details).toEqual({ validationErrors: errors });
  });

  it('should correctly instantiate InternalServerError', () => {
    const error = new InternalServerError();
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('should correctly instantiate ServiceUnavailableError', () => {
    const error = new ServiceUnavailableError('Database');
    expect(error.statusCode).toBe(503);
    expect(error.code).toBe('SERVICE_UNAVAILABLE');
    expect(error.message).toBe('Database service is currently unavailable');
  });
});

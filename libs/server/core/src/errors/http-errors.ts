import { AppError } from './app.error';

/**
 * 400 Bad Request
 * The server cannot process the request due to client error
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details?: Record<string, unknown>) {
    super(message, 'BAD_REQUEST', 400, details);
  }
}

/**
 * 401 Unauthorized
 * Authentication is required and has failed or has not been provided
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: Record<string, unknown>) {
    super(message, 'UNAUTHORIZED', 401, details);
  }
}

/**
 * 403 Forbidden
 * The request was valid but the server is refusing action
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: Record<string, unknown>) {
    super(message, 'FORBIDDEN', 403, details);
  }
}

/**
 * 404 Not Found
 * The requested resource could not be found
 */
export class NotFoundError extends AppError {
  constructor(entity: string, details?: Record<string, unknown>) {
    super(`${entity} not found`, 'NOT_FOUND', 404, {
      entity,
      ...details,
    });
  }
}

/**
 * 409 Conflict
 * Request conflicts with current state of the server
 */
export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, details);
  }
}

/**
 * 422 Unprocessable Entity
 * The request was well-formed but was unable to be followed due to semantic errors
 */
export class ValidationError extends AppError {
  constructor(errors: Record<string, string[]>, message = 'Validation failed') {
    super(message, 'VALIDATION_ERROR', 422, { validationErrors: errors });
  }
}

/**
 * 500 Internal Server Error
 * A generic error message for unexpected conditions
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', details?: Record<string, unknown>) {
    super(message, 'INTERNAL_SERVER_ERROR', 500, details, false);
  }
}

/**
 * 503 Service Unavailable
 * The server is not ready to handle the request
 */
export class ServiceUnavailableError extends AppError {
  constructor(service: string, details?: Record<string, unknown>) {
    super(`${service} service is currently unavailable`, 'SERVICE_UNAVAILABLE', 503, { service, ...details }, false);
  }
}

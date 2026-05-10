/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(message: string, code: string, statusCode: number, details?: Record<string, unknown>, isOperational = true) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    // This is needed to restore the prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

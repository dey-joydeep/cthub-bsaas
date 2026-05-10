import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { AppError } from '../errors/app.error';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Default error response
    let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: Record<string, unknown> | undefined;
    let stack: string | undefined;

    // Handle our custom AppError
    if (exception instanceof AppError) {
      status = exception.statusCode as HttpStatus;
      message = exception.message;
      code = exception.code;
      details = exception.details;

      // Log operational errors (not 5xx) at a lower level
      if (status >= 500) {
        console.error('Server Error:', {
          timestamp: new Date().toISOString(),
          path: request.url,
          error: exception,
          stack: exception.stack,
        });
      } else {
        console.log('Client Error:', {
          timestamp: new Date().toISOString(),
          path: request.url,
          status,
          code,
          message,
          details,
        });
      }
    }
    // Handle NestJS HTTP exceptions
    else if (exception instanceof Error) {
      message = exception.message;
      code = 'UNHANDLED_ERROR';
      stack = process.env['NODE_ENV'] !== 'production' ? exception.stack : undefined;

      console.error('Unhandled Error:', {
        timestamp: new Date().toISOString(),
        path: request.url,
        error: exception,
        stack: exception.stack,
      });
    }

    // In production, don't expose internal errors
    if (process.env['NODE_ENV'] === 'production' && status >= 500) {
      message = 'An internal server error occurred';
      details = undefined;
      stack = undefined;
    }

    response.status(status).json({
      statusCode: status,
      message,
      code,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(details && { details }),
      ...(stack && { stack }),
    });
  }
}

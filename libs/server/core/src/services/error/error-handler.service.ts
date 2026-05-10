import { Injectable } from '@nestjs/common';
import { ErrorService } from './error.service';

export interface HttpErrorResponse {
  status: number;
  statusText: string;
  message: string;
  error?: unknown;
}

@Injectable()
export class ErrorHandlerService {
  constructor(private errorService: ErrorService) {}

  handleError(error: Error | HttpErrorResponse): void {
    // Always log the error to the console
    console.error('Error occurred:', error);

    // Handle HTTP errors
    if (this.isHttpErrorResponse(error)) {
      this.handleHttpError(error);
    }
    // Handle client-side errors
    else if (error instanceof Error) {
      this.handleClientError(error);
    }
  }

  private isHttpErrorResponse(error: unknown): error is HttpErrorResponse {
    if (!error || typeof error !== 'object') return false;
    const e = error as Partial<HttpErrorResponse>;
    return (
      typeof e.status === 'number' &&
      typeof e.statusText === 'string' &&
      typeof e.message === 'string'
    );
  }

  private handleHttpError(error: HttpErrorResponse): void {
    // Delegate to ErrorService for HTTP errors
    this.errorService.handleError(error, 'HTTP');
  }

  private handleClientError(error: Error): void {
    // Delegate to ErrorService for client-side errors
    this.errorService.handleError(error, 'Client');
  }
}

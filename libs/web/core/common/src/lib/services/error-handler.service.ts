import { Injectable } from '@angular/core';

export interface HttpErrorResponseLike {
  status: number;
  statusText: string;
  message: string;
  error?: unknown;
}

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  handleError(error: Error | HttpErrorResponseLike): void {
    // Minimal handler: log with classification
    if (this.isHttpErrorResponse(error)) {
      console.error('[HTTP Error]', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        error: error.error,
      });
    } else if (error instanceof Error) {
      console.error('[Client Error]', error.message, error.stack);
    } else {
      console.error('[Unknown Error]', error);
    }
  }

  private isHttpErrorResponse(error: unknown): error is HttpErrorResponseLike {
    return (
      !!error &&
      typeof (error as { status?: unknown }).status === 'number' &&
      typeof (error as { statusText?: unknown }).statusText === 'string'
    );
  }
}

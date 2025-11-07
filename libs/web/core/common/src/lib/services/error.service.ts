import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  PERMISSION = 'PERMISSION',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface ErrorState {
  type: ErrorType;
  message: string;
  details?: unknown;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  private errorSubject = new BehaviorSubject<ErrorState | null>(null);
  error$ = this.errorSubject.asObservable();

  handleError(error: unknown, context: string = 'App'): void {
    console.error(`[${context}] Error:`, error);

    let errorState: ErrorState = {
      type: ErrorType.UNKNOWN,
      message: 'An unknown error occurred',
      timestamp: new Date(),
    };

    if (error instanceof HttpErrorResponse) {
      errorState = this.handleHttpError(error);
    } else if (error instanceof Error) {
      errorState = {
        type: ErrorType.UNKNOWN,
        message: error.message || 'An unknown error occurred',
        details: error.stack,
        timestamp: new Date(),
      };
    }

    this.errorSubject.next(errorState);
  }

  /**
   * Gets a user-friendly error message from an error object
   * @param error The error object or string
   * @returns A user-friendly error message
   */
  getErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (this.hasMessageProperty(error)) {
      return error.error.message;
    }

    if (this.isErrorWithMessage(error)) {
      return error.message;
    }

    if (this.isHttpErrorResponse(error) && typeof error.statusText === 'string') {
      return error.statusText;
    }

    return 'An unknown error occurred';
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  private handleHttpError(error: HttpErrorResponse): ErrorState {
    const errorState: ErrorState = {
      type: ErrorType.UNKNOWN,
      message: 'An unknown error occurred',
      details: error,
      timestamp: new Date(),
    };

    if (error.status === 0) {
      errorState.type = ErrorType.NETWORK;
      errorState.message = 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.status >= 400 && error.status < 500) {
      errorState.type = ErrorType.VALIDATION;
      const payload: unknown = error.error;
      errorState.message = this.isErrorWithMessage(payload)
        ? payload.message
        : 'An error occurred with your request';
    } else if (error.status >= 500) {
      errorState.type = ErrorType.SERVER;
      errorState.message = 'A server error occurred. Please try again later.';
    }

    return errorState;
  }

  private hasMessageProperty(
    error: unknown,
  ): error is { error: { message: string } } {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const root = error as Record<string, unknown>;
    const nested = root['error'];

    return (
      typeof nested === 'object' &&
      nested !== null &&
      typeof (nested as Record<string, unknown>)['message'] === 'string'
    );
  }

  private isErrorWithMessage(error: unknown): error is { message: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      typeof (error as Record<string, unknown>)['message'] === 'string'
    );
  }

  private isHttpErrorResponse(error: unknown): error is HttpErrorResponse {
    return error instanceof HttpErrorResponse;
  }
}

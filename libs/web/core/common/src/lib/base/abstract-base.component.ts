import { Directive, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { ErrorService } from '../services/error.service';

@Directive()
export abstract class AbstractBaseComponent implements OnInit, OnDestroy {
  protected destroy$ = new Subject<void>();
  private _error: string | null = null;
  private _loading = false;

  constructor(protected errorService: ErrorService) {}

  ngOnInit(): void {
    this.setupErrorSubscription();
  }

  protected setupErrorSubscription(): void {
    this.errorService.error$.subscribe((errorState) => {
      if (errorState) {
        this.loading = false;
        this.error = errorState.message;
        // Clear error after 5 seconds
        setTimeout(() => {
          this.error = null;
        }, 5000);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Helper method for error handling
  protected handleError(error: any): void {
    this.error = this.errorService.getErrorMessage(error);
    this.loading = false;
  }

  protected get loading(): boolean {
    return this._loading;
  }

  protected set loading(value: boolean) {
    this._loading = value;
  }

  protected get error(): string | null {
    return this._error;
  }

  protected set error(value: string | null) {
    this._error = value;
  }
}

import { Directive, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { ErrorService } from '../services/error.service';

@Directive()
export abstract class AbstractBaseComponent implements OnInit, OnDestroy {
  protected destroy$ = new Subject<void>();
  readonly loadingSignal = signal(false);
  readonly errorSignal = signal<string | null>(null);
  protected readonly errorService = inject(ErrorService);

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
  protected handleError(error: unknown): void {
    this.error = this.errorService.getErrorMessage(error);
    this.loading = false;
  }

  public get loading(): boolean {
    return this.loadingSignal();
  }

  public set loading(value: boolean) {
    this.loadingSignal.set(value);
  }

  public get error(): string | null {
    return this.errorSignal();
  }

  public set error(value: string | null) {
    this.errorSignal.set(value);
  }
}

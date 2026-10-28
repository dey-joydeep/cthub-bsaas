import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { REGISTER_API, type RegisterApiPort, type RegisterPayload } from '../../tokens/password.tokens';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private registerApi = inject<RegisterApiPort | null>(REGISTER_API, { optional: true });

  registerForm: FormGroup;
  readonly loadingSignal = signal(false);
  get loading(): boolean {
    return this.loadingSignal();
  }
  set loading(val: boolean) {
    this.loadingSignal.set(val);
  }

  readonly errorSignal = signal<string | null>(null);
  get error(): string | null {
    return this.errorSignal();
  }
  set error(val: string | null) {
    this.errorSignal.set(val);
  }

  readonly successSignal = signal(false);
  get success(): boolean {
    return this.successSignal();
  }
  set success(val: boolean) {
    this.successSignal.set(val);
  }

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      // Add role if needed, e.g. customer/owner
    });
  }

  async onSubmit() {
    if (this.registerForm.invalid) return;
    this.loading = true;
    this.error = null;
    this.success = false;
    try {
      const payload = this.registerForm.value as unknown as RegisterPayload;
      if (this.registerApi) {
        await this.registerApi.register(payload);
      } else {
        // Fallback no-op to keep library buildable when app doesn't provide implementation
        await Promise.resolve();
      }
      this.success = true;
      this.registerForm.reset();
    } catch (err: any) {
      this.error = err?.error?.message || 'Registration failed.';
    } finally {
      this.loading = false;
    }
  }
}

import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { REGISTER_API, type RegisterApiPort, type RegisterPayload } from '../../tokens/password.tokens';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  error: string | null = null;
  success: boolean = false;

  constructor(
    private fb: FormBuilder,
    @Optional() @Inject(REGISTER_API) private registerApi: RegisterApiPort | null,
  ) {
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

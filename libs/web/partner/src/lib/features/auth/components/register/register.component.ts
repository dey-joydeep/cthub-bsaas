import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Tokens
import { RegisterService } from './register.service';
import { RegisterPayload } from './models/register.model';

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
    private registerService: RegisterService,
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
      await this.registerService.register(payload);
      this.success = true;
      this.registerForm.reset();
    } catch (err: any) {
      this.error = err?.error?.message || 'Registration failed.';
    } finally {
      this.loading = false;
    }
  }
}
import { Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StaffRequestService, CreateLeaveRequestPayload } from '../../services/staff-request.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AbstractBaseComponent } from '@cthub-bsaas/web-core/http';
import { ErrorService } from '@cthub-bsaas/web-core/http';

@Component({
  selector: 'app-staff-request-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './staff-request-form.component.html',
})
export class StaffRequestFormComponent extends AbstractBaseComponent {
  @Input() staffId: string = '';
  @Output() requestCreated = new EventEmitter<void>();

  form: FormGroup;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private staffRequestService: StaffRequestService,
    @Inject(ErrorService) protected override errorService: ErrorService,
  ) {
    super(errorService);
    this.form = this.fb.group({
      leaveFrom: ['', Validators.required],
      leaveTo: ['', Validators.required],
      reason: [''],
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.submitting = true;
    // Reset error state
    if (this.errorService) {
      this.errorService.clearError();
    }
    const payload: CreateLeaveRequestPayload = {
      staffId: this.staffId,
      leaveFrom: this.form.value.leaveFrom,
      leaveTo: this.form.value.leaveTo,
      reason: this.form.value.reason,
    };
    this.staffRequestService.createLeaveRequest(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.form.reset();
        this.requestCreated.emit();
      },
      error: (err) => {
        this.submitting = false;
        if (this.errorService) {
          this.errorService.handleError(err, 'Failed to create request');
        }
      },
    });
  }
}

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Observable, forkJoin } from 'rxjs';

import { Customer } from '../customer-crm/models/customer-crm.models';
import { CustomerCrmApi } from '../customer-crm/customer-crm.api';
import { BranchProfile } from '../salon-owner-settings/models/salon-owner-settings.models';
import { SalonOwnerSettingsApi } from '../salon-owner-settings/salon-owner-settings.api';
import { Service, Staff } from '../staff-service-catalog/models/staff-service-catalog.models';
import { StaffServiceCatalogApi } from '../staff-service-catalog/staff-service-catalog.api';
import { Appointment, AvailableSlot } from './models/appointment-scheduling.models';
import { AppointmentSchedulingApi } from './appointment-scheduling.api';

interface LocalDateTimeParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

@Component({
  selector: 'lib-appointment-scheduling',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  templateUrl: './appointment-scheduling.component.html',
  styleUrls: ['./appointment-scheduling.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentSchedulingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settingsApi = inject(SalonOwnerSettingsApi);
  private readonly customerApi = inject(CustomerCrmApi);
  private readonly catalogApi = inject(StaffServiceCatalogApi);
  private readonly appointmentApi = inject(AppointmentSchedulingApi);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly branches = signal<readonly BranchProfile[]>([]);
  protected readonly customers = signal<readonly Customer[]>([]);
  protected readonly staff = signal<readonly Staff[]>([]);
  protected readonly services = signal<readonly Service[]>([]);
  protected readonly slots = signal<readonly AvailableSlot[]>([]);
  protected readonly appointments = signal<readonly Appointment[]>([]);
  protected readonly selectedAppointment = signal<Appointment | null>(null);

  protected readonly boardForm = this.fb.nonNullable.group({
    branchId: ['', Validators.required],
    date: [this.localDateInputValue(), Validators.required],
  });

  protected readonly appointmentForm = this.fb.nonNullable.group({
    branchId: ['', Validators.required],
    customerId: ['', Validators.required],
    serviceId: ['', Validators.required],
    staffId: ['', Validators.required],
    startsAt: ['', Validators.required],
    notes: [''],
    estimatedWaitMinutes: [0, Validators.min(0)],
  });

  protected readonly rescheduleForm = this.fb.nonNullable.group({
    startsAt: ['', Validators.required],
    reason: ['Customer request', Validators.required],
  });

  protected readonly lifecycleReasonForm = this.fb.nonNullable.group({
    reason: ['', Validators.required],
  });

  constructor() {
    this.loadReferences();
  }

  protected loadBoard(): void {
    const value = this.boardForm.getRawValue();
    if (this.boardForm.invalid) {
      this.boardForm.markAllAsTouched();
      return;
    }
    this.persist(this.appointmentApi.getDayBoard(value.branchId, value.date), (board) => {
      this.appointments.set(board.appointments);
      this.selectedAppointment.set(board.appointments[0] ?? null);
    });
  }

  protected findSlots(): void {
    const value = this.appointmentForm.getRawValue();
    if (!value.branchId || !value.serviceId) {
      this.error.set('Select a branch and service before finding slots.');
      return;
    }
    this.persist(this.appointmentApi.findSlots(value.branchId, [value.serviceId], this.boardForm.controls.date.value), (result) =>
      this.slots.set(result.items),
    );
  }

  protected useSlot(slot: AvailableSlot): void {
    this.appointmentForm.patchValue({ staffId: slot.staffId, startsAt: slot.startsAt });
  }

  protected createAppointment(): void {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }
    const value = this.appointmentForm.getRawValue();
    this.persist(
      this.appointmentApi.createAppointment({
        branchId: value.branchId,
        customerId: value.customerId,
        notes: value.notes || undefined,
        lines: [{ serviceId: value.serviceId, staffId: value.staffId, startsAt: this.toBranchUtcIso(value.startsAt, value.branchId) }],
      }),
      (appointment) => {
        this.selectedAppointment.set(appointment);
        this.loadBoard();
      },
    );
  }

  protected createWalkIn(): void {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }
    const value = this.appointmentForm.getRawValue();
    this.persist(
      this.appointmentApi.createWalkInAppointment({
        branchId: value.branchId,
        customerId: value.customerId,
        notes: value.notes || undefined,
        estimatedWaitMinutes: value.estimatedWaitMinutes,
        lines: [{ serviceId: value.serviceId, staffId: value.staffId, startsAt: this.toBranchUtcIso(value.startsAt, value.branchId) }],
      }),
      (appointment) => this.selectedAppointment.set(appointment),
    );
  }

  protected reschedule(): void {
    const appointment = this.selectedAppointment();
    if (!appointment || appointment.lines.length === 0 || this.rescheduleForm.invalid) {
      this.error.set('Select an appointment and complete reschedule details.');
      return;
    }
    const reschedule = this.rescheduleForm.getRawValue();
    this.persist(
      this.appointmentApi.rescheduleAppointment(appointment.id, {
        reason: reschedule.reason,
        lines: appointment.lines.map((line) => ({
          serviceId: line.serviceId,
          staffId: line.staffId,
          startsAt: this.toBranchUtcIso(reschedule.startsAt, appointment.branchId),
        })),
      }),
      (updated) => this.selectedAppointment.set(updated),
    );
  }

  protected runAction(action: 'confirm' | 'arrive' | 'start' | 'complete' | 'no-show' | 'cancel'): void {
    const appointment = this.selectedAppointment();
    if (!appointment) {
      this.error.set('Select an appointment before changing status.');
      return;
    }
    const reason = this.lifecycleReasonForm.controls.reason.value.trim();
    if ((action === 'cancel' || action === 'no-show') && !reason) {
      this.lifecycleReasonForm.markAllAsTouched();
      this.error.set('Enter a reason before cancelling or marking no-show.');
      return;
    }
    const request =
      action === 'confirm'
        ? this.appointmentApi.confirmAppointment(appointment.id)
        : action === 'arrive'
          ? this.appointmentApi.markAppointmentArrived(appointment.id)
          : action === 'start'
            ? this.appointmentApi.startAppointmentService(appointment.id)
            : action === 'complete'
              ? this.appointmentApi.completeAppointment(appointment.id)
              : action === 'no-show'
                ? this.appointmentApi.markAppointmentNoShow(appointment.id, reason)
                : this.appointmentApi.cancelAppointment(appointment.id, reason);
    this.persist(request, (updated) => this.selectedAppointment.set(updated));
  }

  protected selectAppointment(appointment: Appointment): void {
    this.selectedAppointment.set(appointment);
  }

  protected serviceName(serviceId: string): string {
    return this.services().find((service) => service.id === serviceId)?.name ?? serviceId;
  }

  protected staffName(staffId: string): string {
    return this.staff().find((member) => member.id === staffId)?.displayName ?? staffId;
  }

  private loadReferences(): void {
    this.loading.set(true);
    forkJoin({
      branches: this.settingsApi.listBranches(),
      customers: this.customerApi.searchCustomers(),
      staff: this.catalogApi.listStaff(),
      services: this.catalogApi.listServices(),
    }).subscribe({
      next: ({ branches, customers, staff, services }) => {
        this.branches.set(branches.items);
        this.customers.set(customers.items);
        this.staff.set(staff.items);
        this.services.set(services.items);
        this.applyDefaults();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Scheduling references could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  private applyDefaults(): void {
    const branchId = this.branches()[0]?.id ?? '';
    const customerId = this.customers()[0]?.id ?? '';
    const serviceId = this.services()[0]?.id ?? '';
    const staffId = this.staff()[0]?.id ?? '';
    this.boardForm.patchValue({ branchId });
    this.appointmentForm.patchValue({ branchId, customerId, serviceId, staffId });
  }

  private localDateInputValue(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toBranchUtcIso(value: string, branchId: string): string {
    if (/(?:z|[+-]\d{2}:\d{2})$/i.test(value)) {
      return new Date(value).toISOString();
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
    if (!match) {
      return new Date(value).toISOString();
    }
    const parts: LocalDateTimeParts = {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
      hour: Number(match[4]),
      minute: Number(match[5]),
      second: Number(match[6] ?? 0),
    };
    return this.zonedLocalDateTimeToUtcIso(parts, this.branchTimezone(branchId));
  }

  private branchTimezone(branchId: string): string {
    return this.branches().find((branch) => branch.id === branchId)?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  private zonedLocalDateTimeToUtcIso(parts: LocalDateTimeParts, timeZone: string): string {
    const desiredWallTime = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    let utcTime = desiredWallTime;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const actual = this.timeZoneParts(new Date(utcTime), timeZone);
      const actualWallTime = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
      utcTime -= actualWallTime - desiredWallTime;
    }
    return new Date(utcTime).toISOString();
  }

  private timeZoneParts(date: Date, timeZone: string): LocalDateTimeParts {
    const values = new Map(
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(date)
        .map((part) => [part.type, part.value]),
    );
    return {
      year: Number(values.get('year')),
      month: Number(values.get('month')),
      day: Number(values.get('day')),
      hour: Number(values.get('hour')),
      minute: Number(values.get('minute')),
      second: Number(values.get('second')),
    };
  }

  private persist<T>(request: Observable<T>, onSuccess?: (value: T) => void): void {
    this.saving.set(true);
    this.message.set(null);
    this.error.set(null);
    request.subscribe({
      next: (value) => {
        onSuccess?.(value);
        this.message.set('Appointment saved.');
        this.saving.set(false);
      },
      error: () => {
        this.error.set('Appointment could not be saved.');
        this.saving.set(false);
      },
    });
  }
}

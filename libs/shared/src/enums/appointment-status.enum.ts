/**
 * Unified AppointmentStatus enum for the entire application
 * All appointment statuses should be defined here to maintain consistency
 */
export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NOSHOW = 'NOSHOW',
  RESCHEDULED = 'RESCHEDULED',
}

/**
 * Type guard to check if a value is a valid AppointmentStatus
 * @param status The value to check
 * @returns boolean indicating if the value is a valid AppointmentStatus
 */
export function isAppointmentStatus(status: any): status is AppointmentStatus {
  return Object.values(AppointmentStatus).includes(status);
}

/**
 * Gets a display-friendly label for an appointment status
 * @param status The appointment status
 * @returns A display-friendly label
 */
export function getAppointmentStatusLabel(status: AppointmentStatus): string {
  const labels: Record<AppointmentStatus, string> = {
    [AppointmentStatus.PENDING]: 'Pending',
    [AppointmentStatus.CONFIRMED]: 'Confirmed',
    [AppointmentStatus.COMPLETED]: 'Completed',
    [AppointmentStatus.CANCELLED]: 'Cancelled',
    [AppointmentStatus.NOSHOW]: 'No Show',
    [AppointmentStatus.RESCHEDULED]: 'Rescheduled',
  };

  return labels[status] || status;
}

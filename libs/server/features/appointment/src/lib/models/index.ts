// Export all models and types
// Only export model types and interfaces, not DTOs
export type {
  AppointmentWithDetails,
  RawAppointment,
  ServiceWithDetails,
  UserWithMinimalInfo,
  SalonWithMinimalInfo,
  StaffWithUser,
  AppointmentServiceWithDetails,
} from './appointment.model';
export * from './appointment.includes';
export * from './user-params.model';

// Export includes from the includes directory
export * from './includes/base.includes';
export * from './includes/customer.includes';
export * from './includes/review.includes';
export * from './includes/service.includes';
export * from './includes/user.includes';

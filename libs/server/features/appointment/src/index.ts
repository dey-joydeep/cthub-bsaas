// Module
export { AppointmentModule } from './lib/appointment.module';

// Export the module as default
export { AppointmentModule as default } from './lib/appointment.module';

// Export DTOs
export { AppointmentDto } from './lib/dto/appointment.dto';
export { CreateAppointmentDto } from './lib/dto/requests/create-appointment.dto';
export { UpdateAppointmentDto } from './lib/dto/requests/update-appointment.dto';
// Do not re-export DTOs from models to avoid duplication.

// Export services
export * from './lib/services';

// Export controllers
export * from './lib/controllers';

// Export models, interfaces and types
// Only export non-DTO models and types that are not already exported via DTOs
export type { AppointmentWithDetails } from './lib/models/appointment.model';
export type { UserWithMinimalInfo } from './lib/models/appointment.model';
export * from './lib/models/appointment.includes';
export * from './lib/models/user-params.model';
export * from './lib/models/includes/base.includes';
export * from './lib/models/includes/customer.includes';
export * from './lib/models/includes/review.includes';
export * from './lib/models/includes/service.includes';
export * from './lib/models/includes/user.includes';

// Export constants and enums
// export * from './lib/constants'; // File does not exist, so comment out

// Export types
// export * from './lib/types'; // File does not exist, so comment out

// Re-export common types for convenience
export type { Appointment, AppointmentStatus } from '@prisma/client';

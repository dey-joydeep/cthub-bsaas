import type { AuthenticatedUser } from '@cthub-bsaas/shared';

import { AppointmentSchedulingController } from './appointment-scheduling.controller';
import type { AppointmentSchedulingService } from '../services/appointment-scheduling.service';

const user: AuthenticatedUser = { id: 'user-1', email: 'owner@example.com', roles: [], tenantId: 'tenant-1' };

function serviceMock() {
  return {
    getAppointmentDayBoard: jest.fn(),
    findAppointmentSlots: jest.fn(),
    createAppointment: jest.fn(),
    createWalkInAppointment: jest.fn(),
    getAppointment: jest.fn(),
    rescheduleAppointment: jest.fn(),
    confirmAppointment: jest.fn(),
    cancelAppointment: jest.fn(),
    markAppointmentNoShow: jest.fn(),
    markAppointmentArrived: jest.fn(),
    startAppointmentService: jest.fn(),
    completeAppointment: jest.fn(),
  };
}

describe('AppointmentSchedulingController', () => {
  it('delegates appointment routes to the service with authenticated context', async () => {
    const service = serviceMock();
    const controller = new AppointmentSchedulingController(service as unknown as AppointmentSchedulingService);
    const appointment = {
      branchId: 'branch-1',
      customerId: 'customer-1',
      lines: [{ serviceId: 'service-1', staffId: 'staff-1', startsAt: '2026-05-26T09:00:00.000Z' }],
    };
    const reschedule = { lines: appointment.lines, reason: 'Customer request' };

    await controller.getAppointmentDayBoard(user, 'branch-1', '2026-05-26');
    await controller.findAppointmentSlots(user, 'branch-1', 'service-1', '2026-05-26');
    await controller.createAppointment(user, appointment);
    await controller.createWalkInAppointment(user, { ...appointment, estimatedWaitMinutes: 10 });
    await controller.getAppointment(user, 'appointment-1');
    await controller.rescheduleAppointment(user, 'appointment-1', reschedule);
    await controller.confirmAppointment(user, 'appointment-1');
    await controller.cancelAppointment(user, 'appointment-1', { reason: 'Customer request' });
    await controller.markAppointmentNoShow(user, 'appointment-1');
    await controller.markAppointmentArrived(user, 'appointment-1');
    await controller.startAppointmentService(user, 'appointment-1');
    await controller.completeAppointment(user, 'appointment-1');

    expect(service.getAppointmentDayBoard).toHaveBeenCalledWith({ user }, 'branch-1', '2026-05-26');
    expect(service.findAppointmentSlots).toHaveBeenCalledWith({ user }, 'branch-1', ['service-1'], '2026-05-26');
    expect(service.createAppointment).toHaveBeenCalledWith({ user }, appointment);
    expect(service.createWalkInAppointment).toHaveBeenCalledWith({ user }, { ...appointment, estimatedWaitMinutes: 10 });
    expect(service.getAppointment).toHaveBeenCalledWith({ user }, 'appointment-1');
    expect(service.rescheduleAppointment).toHaveBeenCalledWith({ user }, 'appointment-1', reschedule);
    expect(service.confirmAppointment).toHaveBeenCalledWith({ user }, 'appointment-1');
    expect(service.cancelAppointment).toHaveBeenCalledWith({ user }, 'appointment-1', { reason: 'Customer request' });
    expect(service.markAppointmentNoShow).toHaveBeenCalledWith({ user }, 'appointment-1');
    expect(service.markAppointmentArrived).toHaveBeenCalledWith({ user }, 'appointment-1');
    expect(service.startAppointmentService).toHaveBeenCalledWith({ user }, 'appointment-1');
    expect(service.completeAppointment).toHaveBeenCalledWith({ user }, 'appointment-1');
  });
});

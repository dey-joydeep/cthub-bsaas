import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@cthub-bsaas/server-core';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';

import { AppointmentInputDto, ReasonInputDto, RescheduleAppointmentInputDto, WalkInAppointmentInputDto } from '../dto/appointment-scheduling.dto';
import { AppointmentSchedulingService } from '../services/appointment-scheduling.service';

@ApiTags('Appointments')
@Controller('partner/appointments')
export class AppointmentSchedulingController {
  constructor(private readonly appointments: AppointmentSchedulingService) {}

  @Get('day-board')
  @ApiOperation({ operationId: 'getAppointmentDayBoard' })
  getAppointmentDayBoard(@CurrentUser() user: AuthenticatedUser, @Query('branchId') branchId: string, @Query('date') date: string) {
    return this.appointments.getAppointmentDayBoard({ user }, branchId, date);
  }

  @Get('slots')
  @ApiOperation({ operationId: 'findAppointmentSlots' })
  findAppointmentSlots(
    @CurrentUser() user: AuthenticatedUser,
    @Query('branchId') branchId: string,
    @Query('serviceIds') serviceIds: string | string[],
    @Query('date') date: string,
  ) {
    return this.appointments.findAppointmentSlots({ user }, branchId, Array.isArray(serviceIds) ? serviceIds : [serviceIds], date);
  }

  @Post()
  @ApiOperation({ operationId: 'createAppointment' })
  createAppointment(@CurrentUser() user: AuthenticatedUser, @Body() body: AppointmentInputDto) {
    return this.appointments.createAppointment({ user }, body);
  }

  @Post('walk-ins')
  @ApiOperation({ operationId: 'createWalkInAppointment' })
  createWalkInAppointment(@CurrentUser() user: AuthenticatedUser, @Body() body: WalkInAppointmentInputDto) {
    return this.appointments.createWalkInAppointment({ user }, body);
  }

  @Get(':appointmentId')
  @ApiOperation({ operationId: 'getAppointment' })
  getAppointment(@CurrentUser() user: AuthenticatedUser, @Param('appointmentId') appointmentId: string) {
    return this.appointments.getAppointment({ user }, appointmentId);
  }

  @Post(':appointmentId/reschedule')
  @ApiOperation({ operationId: 'rescheduleAppointment' })
  rescheduleAppointment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appointmentId') appointmentId: string,
    @Body() body: RescheduleAppointmentInputDto,
  ) {
    return this.appointments.rescheduleAppointment({ user }, appointmentId, body);
  }

  @Post(':appointmentId/confirm')
  @ApiOperation({ operationId: 'confirmAppointment' })
  confirmAppointment(@CurrentUser() user: AuthenticatedUser, @Param('appointmentId') appointmentId: string) {
    return this.appointments.confirmAppointment({ user }, appointmentId);
  }

  @Post(':appointmentId/cancel')
  @ApiOperation({ operationId: 'cancelAppointment' })
  cancelAppointment(@CurrentUser() user: AuthenticatedUser, @Param('appointmentId') appointmentId: string, @Body() body: ReasonInputDto) {
    return this.appointments.cancelAppointment({ user }, appointmentId, body);
  }

  @Post(':appointmentId/no-show')
  @ApiOperation({ operationId: 'markAppointmentNoShow' })
  markAppointmentNoShow(@CurrentUser() user: AuthenticatedUser, @Param('appointmentId') appointmentId: string) {
    return this.appointments.markAppointmentNoShow({ user }, appointmentId);
  }

  @Post(':appointmentId/arrive')
  @ApiOperation({ operationId: 'markAppointmentArrived' })
  markAppointmentArrived(@CurrentUser() user: AuthenticatedUser, @Param('appointmentId') appointmentId: string) {
    return this.appointments.markAppointmentArrived({ user }, appointmentId);
  }

  @Post(':appointmentId/start')
  @ApiOperation({ operationId: 'startAppointmentService' })
  startAppointmentService(@CurrentUser() user: AuthenticatedUser, @Param('appointmentId') appointmentId: string) {
    return this.appointments.startAppointmentService({ user }, appointmentId);
  }

  @Post(':appointmentId/complete')
  @ApiOperation({ operationId: 'completeAppointment' })
  completeAppointment(@CurrentUser() user: AuthenticatedUser, @Param('appointmentId') appointmentId: string) {
    return this.appointments.completeAppointment({ user }, appointmentId);
  }
}

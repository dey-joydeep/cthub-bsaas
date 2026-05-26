import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@cthub-bsaas/server-core';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';

import {
  CustomerBookingContextQueryDto,
  CustomerBookingInputDto,
  CustomerCancelInputDto,
  CustomerFavoriteInputDto,
  CustomerRescheduleInputDto,
  CustomerReviewInputDto,
} from '../dto/customer-app.dto';
import { CustomerAppService } from '../services/customer-app.service';

@ApiTags('Customer App')
@Controller('customer')
export class CustomerAppController {
  constructor(private readonly customerApp: CustomerAppService) {}

  @Get('dashboard')
  @ApiOperation({ operationId: 'getCustomerDashboard' })
  getCustomerDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.customerApp.getCustomerDashboard(user);
  }

  @Get('booking/context')
  @ApiOperation({ operationId: 'getCustomerBookingContext' })
  getCustomerBookingContext(@Query() query: CustomerBookingContextQueryDto) {
    return this.customerApp.getCustomerBookingContext(query);
  }

  @Post('bookings')
  @ApiOperation({ operationId: 'createCustomerBooking' })
  createCustomerBooking(@CurrentUser() user: AuthenticatedUser, @Body() body: CustomerBookingInputDto) {
    return this.customerApp.createCustomerBooking(user, body);
  }

  @Get('appointments')
  @ApiOperation({ operationId: 'listCustomerAppointments' })
  listCustomerAppointments(@CurrentUser() user: AuthenticatedUser, @Query('limit') limit?: string) {
    return this.customerApp.listCustomerAppointments(user, limit ? Number(limit) : undefined);
  }

  @Post('appointments/:id/reschedule')
  @ApiOperation({ operationId: 'rescheduleCustomerAppointment' })
  rescheduleCustomerAppointment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: CustomerRescheduleInputDto) {
    return this.customerApp.rescheduleCustomerAppointment(user, id, body);
  }

  @Post('appointments/:id/cancel')
  @ApiOperation({ operationId: 'cancelCustomerAppointment' })
  cancelCustomerAppointment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: CustomerCancelInputDto) {
    return this.customerApp.cancelCustomerAppointment(user, id, body);
  }

  @Get('favorites')
  @ApiOperation({ operationId: 'listCustomerFavorites' })
  listCustomerFavorites(@CurrentUser() user: AuthenticatedUser, @Query('targetType') targetType?: string) {
    return this.customerApp.listCustomerFavorites(user, targetType);
  }

  @Put('favorites/:targetType/:targetId')
  @ApiOperation({ operationId: 'upsertCustomerFavorite' })
  upsertCustomerFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Body() body: CustomerFavoriteInputDto,
  ) {
    return this.customerApp.upsertCustomerFavorite(user, targetType, targetId, body);
  }

  @Get('rewards')
  @ApiOperation({ operationId: 'listCustomerRewards' })
  listCustomerRewards(@CurrentUser() user: AuthenticatedUser, @Query('businessId') businessId?: string) {
    return this.customerApp.listCustomerRewards(user, businessId);
  }

  @Get('receipts')
  @ApiOperation({ operationId: 'listCustomerReceipts' })
  listCustomerReceipts(@CurrentUser() user: AuthenticatedUser, @Query('businessId') businessId?: string, @Query('limit') limit?: string) {
    return this.customerApp.listCustomerReceipts(user, businessId, limit ? Number(limit) : undefined);
  }

  @Post('reviews')
  @ApiOperation({ operationId: 'submitCustomerReview' })
  submitCustomerReview(@CurrentUser() user: AuthenticatedUser, @Body() body: CustomerReviewInputDto) {
    return this.customerApp.submitCustomerReview(user, body);
  }
}

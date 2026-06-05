import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, ResponseEnvelopeInterceptor } from '@cthub-bsaas/server-core';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';

import {
  ServiceCategoryInputDto,
  ServiceInputDto,
  ServiceStatusInputDto,
  StaffEligibilityInputDto,
} from '../dto/staff-service-catalog.dto';
import { StaffServiceCatalogService } from '../services/staff-service-catalog.service';

@ApiTags('Service Catalog')
@UseInterceptors(ResponseEnvelopeInterceptor)
@Controller('partner')
export class ServiceCatalogController {
  constructor(private readonly catalog: StaffServiceCatalogService) {}

  @Get('service-categories')
  @ApiOperation({ operationId: 'listServiceCategories' })
  listServiceCategories(
    @CurrentUser() user: AuthenticatedUser,
    @Query('businessId', new ParseUUIDPipe({ optional: true })) businessId?: string,
  ) {
    return this.catalog.listServiceCategories({ user }, businessId);
  }

  @Post('service-categories')
  @ApiOperation({ operationId: 'createServiceCategory' })
  createServiceCategory(@CurrentUser() user: AuthenticatedUser, @Body() body: ServiceCategoryInputDto) {
    return this.catalog.createServiceCategory({ user }, body);
  }

  @Get('services')
  @ApiOperation({ operationId: 'listServices' })
  listServices(
    @CurrentUser() user: AuthenticatedUser,
    @Query('categoryId', new ParseUUIDPipe({ optional: true })) categoryId?: string,
    @Query('businessId', new ParseUUIDPipe({ optional: true })) businessId?: string,
  ) {
    return this.catalog.listServices({ user }, { categoryId, businessId });
  }

  @Post('services')
  @ApiOperation({ operationId: 'createService' })
  createService(@CurrentUser() user: AuthenticatedUser, @Body() body: ServiceInputDto) {
    return this.catalog.createService({ user }, body);
  }

  @Get('services/:serviceId')
  @ApiOperation({ operationId: 'getService' })
  getService(@CurrentUser() user: AuthenticatedUser, @Param('serviceId', new ParseUUIDPipe()) serviceId: string) {
    return this.catalog.getService({ user }, serviceId);
  }

  @Patch('services/:serviceId')
  @ApiOperation({ operationId: 'updateService' })
  updateService(
    @CurrentUser() user: AuthenticatedUser,
    @Param('serviceId', new ParseUUIDPipe()) serviceId: string,
    @Body() body: ServiceInputDto,
  ) {
    return this.catalog.updateService({ user }, serviceId, body);
  }

  @Put('services/:serviceId/status')
  @ApiOperation({ operationId: 'updateServiceStatus' })
  updateServiceStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('serviceId', new ParseUUIDPipe()) serviceId: string,
    @Body() body: ServiceStatusInputDto,
  ) {
    return this.catalog.updateServiceStatus({ user }, serviceId, body);
  }

  @Put('services/:serviceId/staff-eligibility')
  @ApiOperation({ operationId: 'replaceServiceStaffEligibility' })
  replaceServiceStaffEligibility(
    @CurrentUser() user: AuthenticatedUser,
    @Param('serviceId', new ParseUUIDPipe()) serviceId: string,
    @Body() body: StaffEligibilityInputDto,
  ) {
    return this.catalog.replaceServiceStaffEligibility({ user }, serviceId, body);
  }
}

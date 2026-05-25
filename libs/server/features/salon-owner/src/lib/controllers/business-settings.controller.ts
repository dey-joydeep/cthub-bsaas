import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@cthub-bsaas/server-core';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';

import { SalonBusinessInputDto } from '../dto/salon-business.dto';
import { SalonOwnerSettingsService } from '../services/salon-owner-settings.service';

@ApiTags('Business Settings')
@Controller('partner/businesses')
export class BusinessSettingsController {
  constructor(private readonly settings: SalonOwnerSettingsService) {}

  @Get()
  @ApiOperation({ operationId: 'listSalonBusinesses' })
  listBusinesses(@CurrentUser() user: AuthenticatedUser) {
    return this.settings.listBusinesses({ user });
  }

  @Post()
  @ApiOperation({ operationId: 'createSalonBusiness' })
  createBusiness(@CurrentUser() user: AuthenticatedUser, @Body() body: SalonBusinessInputDto) {
    return this.settings.createBusiness({ user }, body);
  }

  @Get(':businessId')
  @ApiOperation({ operationId: 'getSalonBusiness' })
  getBusiness(@CurrentUser() user: AuthenticatedUser, @Param('businessId') businessId: string) {
    return this.settings.getBusiness({ user }, businessId);
  }

  @Patch(':businessId')
  @ApiOperation({ operationId: 'updateSalonBusiness' })
  updateBusiness(@CurrentUser() user: AuthenticatedUser, @Param('businessId') businessId: string, @Body() body: SalonBusinessInputDto) {
    return this.settings.updateBusiness({ user }, businessId, body);
  }
}

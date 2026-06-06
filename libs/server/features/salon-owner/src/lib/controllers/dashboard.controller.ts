import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@cthub-bsaas/server-core';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';

import { DashboardQueryService } from '../services/dashboard-query.service';

@ApiTags('Dashboard')
@Controller('partner/dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardQueryService) {}

  @Get('owner')
  @ApiOperation({ operationId: 'getOwnerDashboard' })
  getOwnerDashboard(@CurrentUser() user: AuthenticatedUser, @Query('branchId') branchId?: string, @Query('date') date?: string) {
    return this.dashboard.getOwnerDashboard({ user }, branchId, date);
  }

  @Get('alerts')
  @ApiOperation({ operationId: 'listDashboardAlerts' })
  listDashboardAlerts(@CurrentUser() user: AuthenticatedUser, @Query('branchId') branchId?: string) {
    return this.dashboard.listDashboardAlerts({ user }, branchId);
  }
}

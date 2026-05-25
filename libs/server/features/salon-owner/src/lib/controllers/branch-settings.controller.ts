import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@cthub-bsaas/server-core';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';

import { BranchHolidayInputDto, BranchPolicyInputDto, BranchProfileInputDto, WeeklyHoursInputDto } from '../dto/branch-settings.dto';
import { SalonOwnerSettingsService } from '../services/salon-owner-settings.service';

@ApiTags('Business Settings')
@Controller('partner/branches')
export class BranchSettingsController {
  constructor(private readonly settings: SalonOwnerSettingsService) {}

  @Get()
  @ApiOperation({ operationId: 'listBranches' })
  listBranches(@CurrentUser() user: AuthenticatedUser, @Query('businessId') businessId?: string) {
    return this.settings.listBranches({ user }, businessId);
  }

  @Post()
  @ApiOperation({ operationId: 'createBranch' })
  createBranch(@CurrentUser() user: AuthenticatedUser, @Body() body: BranchProfileInputDto) {
    return this.settings.createBranch({ user }, body);
  }

  @Get(':branchId')
  @ApiOperation({ operationId: 'getBranch' })
  getBranch(@CurrentUser() user: AuthenticatedUser, @Param('branchId') branchId: string) {
    return this.settings.getBranch({ user }, branchId);
  }

  @Patch(':branchId')
  @ApiOperation({ operationId: 'updateBranch' })
  updateBranch(@CurrentUser() user: AuthenticatedUser, @Param('branchId') branchId: string, @Body() body: BranchProfileInputDto) {
    return this.settings.updateBranch({ user }, branchId, body);
  }

  @Put(':branchId/hours')
  @ApiOperation({ operationId: 'replaceBranchHours' })
  replaceBranchHours(@CurrentUser() user: AuthenticatedUser, @Param('branchId') branchId: string, @Body() body: WeeklyHoursInputDto) {
    return this.settings.replaceBranchHours({ user }, branchId, body);
  }

  @Put(':branchId/holidays/:date')
  @ApiOperation({ operationId: 'setBranchHoliday' })
  setBranchHoliday(
    @CurrentUser() user: AuthenticatedUser,
    @Param('branchId') branchId: string,
    @Param('date') date: string,
    @Body() body: BranchHolidayInputDto,
  ) {
    return this.settings.setBranchHoliday({ user }, branchId, date, body);
  }

  @Put(':branchId/policy')
  @ApiOperation({ operationId: 'updateBranchPolicy' })
  updateBranchPolicy(@CurrentUser() user: AuthenticatedUser, @Param('branchId') branchId: string, @Body() body: BranchPolicyInputDto) {
    return this.settings.updateBranchPolicy({ user }, branchId, body);
  }
}

import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, ResponseEnvelopeInterceptor, Roles } from '@cthub-bsaas/server-core';
import { UserRole, type AuthenticatedUser } from '@cthub-bsaas/shared';

import { BranchHolidayInputDto, BranchPolicyInputDto, BranchProfileInputDto, WeeklyHoursInputDto } from '../dto/branch-settings.dto';
import { SalonOwnerSettingsService } from '../services/salon-owner-settings.service';

@ApiTags('Business Settings')
@Roles(UserRole.OWNER, UserRole.ADMIN)
@UseInterceptors(ResponseEnvelopeInterceptor)
@Controller('partner/branches')
export class BranchSettingsController {
  constructor(private readonly settings: SalonOwnerSettingsService) {}

  @Get()
  @ApiOperation({ operationId: 'listBranches' })
  listBranches(@CurrentUser() user: AuthenticatedUser, @Query('businessId', new ParseUUIDPipe({ optional: true })) businessId?: string) {
    return this.settings.listBranches({ user }, businessId);
  }

  @Post()
  @ApiOperation({ operationId: 'createBranch' })
  createBranch(@CurrentUser() user: AuthenticatedUser, @Body() body: BranchProfileInputDto) {
    return this.settings.createBranch({ user }, body);
  }

  @Get(':branchId')
  @ApiOperation({ operationId: 'getBranch' })
  getBranch(@CurrentUser() user: AuthenticatedUser, @Param('branchId', new ParseUUIDPipe()) branchId: string) {
    return this.settings.getBranch({ user }, branchId);
  }

  @Patch(':branchId')
  @ApiOperation({ operationId: 'updateBranch' })
  updateBranch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('branchId', new ParseUUIDPipe()) branchId: string,
    @Body() body: BranchProfileInputDto,
  ) {
    return this.settings.updateBranch({ user }, branchId, body);
  }

  @Put(':branchId/hours')
  @ApiOperation({ operationId: 'replaceBranchHours' })
  replaceBranchHours(
    @CurrentUser() user: AuthenticatedUser,
    @Param('branchId', new ParseUUIDPipe()) branchId: string,
    @Body() body: WeeklyHoursInputDto,
  ) {
    return this.settings.replaceBranchHours({ user }, branchId, body);
  }

  @Put(':branchId/holidays/:date')
  @ApiOperation({ operationId: 'setBranchHoliday' })
  setBranchHoliday(
    @CurrentUser() user: AuthenticatedUser,
    @Param('branchId', new ParseUUIDPipe()) branchId: string,
    @Param('date') date: string,
    @Body() body: BranchHolidayInputDto,
  ) {
    return this.settings.setBranchHoliday({ user }, branchId, date, body);
  }

  @Put(':branchId/policy')
  @ApiOperation({ operationId: 'updateBranchPolicy' })
  updateBranchPolicy(
    @CurrentUser() user: AuthenticatedUser,
    @Param('branchId', new ParseUUIDPipe()) branchId: string,
    @Body() body: BranchPolicyInputDto,
  ) {
    return this.settings.updateBranchPolicy({ user }, branchId, body);
  }
}

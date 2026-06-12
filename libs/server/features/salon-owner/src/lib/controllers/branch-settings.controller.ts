import { BadRequestException, Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseInterceptors, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, ResponseEnvelopeInterceptor, Roles } from '@cthub-bsaas/server-core';
import { COMMON_MESSAGE_KEYS, UserRole, type AuthenticatedUser } from '@cthub-bsaas/shared';

import { BranchHolidayInputDto, BranchPolicyInputDto, BranchProfileInputDto, WeeklyHoursInputDto } from '../dto/branch-settings.dto';
import { SalonOwnerSettingsService } from '../services/salon-owner-settings.service';

function readIdempotencyKey(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length < 8 || trimmed.length > 128) {
    throw new BadRequestException(COMMON_MESSAGE_KEYS.ERROR.VALIDATION);
  }
  return trimmed;
}

@ApiTags('Business Settings')
@Roles(UserRole.OWNER, UserRole.ADMIN)
@UseInterceptors(ResponseEnvelopeInterceptor)
@Controller({ path: 'partner/branches', version: VERSION_NEUTRAL })
export class BranchSettingsController {
  constructor(private readonly settings: SalonOwnerSettingsService) {}

  @Get()
  @ApiOperation({ operationId: 'listBranches' })
  listBranches(@CurrentUser() user: AuthenticatedUser, @Query('businessId', new ParseUUIDPipe({ optional: true })) businessId?: string) {
    return this.settings.listBranches({ user }, businessId);
  }

  @Post()
  @ApiOperation({ operationId: 'createBranch' })
  createBranch(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('Idempotency-Key') idempotencyKey: string | undefined,
    @Body() body: BranchProfileInputDto,
  ) {
    return this.settings.createBranch({ user, idempotencyKey: readIdempotencyKey(idempotencyKey) }, body);
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

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseInterceptors,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, ResponseEnvelopeInterceptor, Roles } from '@cthub-bsaas/server-core';
import { COMMON_MESSAGE_KEYS, UserRole, type AuthenticatedUser } from '@cthub-bsaas/shared';

import { BranchHolidayInputDto, BranchPolicyInputDto, BranchProfileInputDto, WeeklyHoursInputDto } from '../dto/branch-settings.dto';
import { SalonOwnerSettingsService } from '../services/salon-owner-settings.service';
import { salonOwnerStatuses, type SalonOwnerStatus } from '../models/salon-owner-settings.models';

function readIdempotencyKey(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length < 8 || trimmed.length > 128) {
    throw new BadRequestException(COMMON_MESSAGE_KEYS.ERROR.VALIDATION);
  }
  return trimmed;
}

function readOptionalQueryString(value: string | readonly string[] | undefined): string | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(COMMON_MESSAGE_KEYS.ERROR.VALIDATION);
  }

  return value;
}

function readStatus(value: string | readonly string[] | undefined): SalonOwnerStatus | undefined {
  const text = readOptionalQueryString(value);
  if (!text) {
    return undefined;
  }

  if (!salonOwnerStatuses.includes(text as SalonOwnerStatus)) {
    throw new BadRequestException(COMMON_MESSAGE_KEYS.ERROR.VALIDATION);
  }

  return text as SalonOwnerStatus;
}

@ApiTags('Business Settings')
@Roles(UserRole.OWNER, UserRole.ADMIN)
@UseInterceptors(ResponseEnvelopeInterceptor)
@Controller({ path: 'partner/branches', version: VERSION_NEUTRAL })
export class BranchSettingsController {
  constructor(private readonly settings: SalonOwnerSettingsService) {}

  @Get()
  @ApiOperation({ operationId: 'listBranches' })
  listBranches(
    @CurrentUser() user: AuthenticatedUser,
    @Query('businessId', new ParseUUIDPipe({ optional: true })) businessId?: string,
    @Query('status') status?: string | string[],
    @Query('q') q?: string | string[],
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    return this.settings.listBranches(
      { user },
      businessId,
      { status: readStatus(status), q: readOptionalQueryString(q) },
      { page, pageSize },
    );
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

  @Get(':branchId/hours')
  @ApiOperation({ operationId: 'getBranchHours' })
  getBranchHours(@CurrentUser() user: AuthenticatedUser, @Param('branchId', new ParseUUIDPipe()) branchId: string) {
    return this.settings.getBranchHours({ user }, branchId);
  }

  @Get(':branchId/holidays')
  @ApiOperation({ operationId: 'listBranchHolidays' })
  listBranchHolidays(@CurrentUser() user: AuthenticatedUser, @Param('branchId', new ParseUUIDPipe()) branchId: string) {
    return this.settings.listBranchHolidays({ user }, branchId);
  }

  @Get(':branchId/policy')
  @ApiOperation({ operationId: 'getBranchPolicy' })
  getBranchPolicy(@CurrentUser() user: AuthenticatedUser, @Param('branchId', new ParseUUIDPipe()) branchId: string) {
    return this.settings.getBranchPolicy({ user }, branchId);
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

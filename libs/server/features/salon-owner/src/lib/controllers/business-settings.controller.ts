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
  Query,
  UseInterceptors,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, ResponseEnvelopeInterceptor, Roles } from '@cthub-bsaas/server-core';
import { COMMON_MESSAGE_KEYS, UserRole, type AuthenticatedUser } from '@cthub-bsaas/shared';

import type { SalonOwnerSupportContext } from '../models/salon-owner-settings.models';
import { SalonBusinessInputDto } from '../dto/salon-business.dto';
import { SalonOwnerSettingsService } from '../services/salon-owner-settings.service';

function readIdempotencyKey(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length < 8 || trimmed.length > 128) {
    throw new BadRequestException(COMMON_MESSAGE_KEYS.ERROR.VALIDATION);
  }
  return trimmed;
}

function hasRole(user: AuthenticatedUser, role: UserRole): boolean {
  return user.roles.some((entry) => {
    const value = typeof entry === 'string' ? entry : entry?.name;
    return typeof value === 'string' && value.toLowerCase() === role.toLowerCase();
  });
}

function readSupportContext(
  user: AuthenticatedUser,
  supportReference: string | undefined,
  supportReason: string | undefined,
): SalonOwnerSupportContext | undefined {
  if (!hasRole(user, UserRole.ADMIN) || hasRole(user, UserRole.OWNER)) {
    return undefined;
  }

  const reference = supportReference?.trim();
  const reason = supportReason?.trim();
  if (!reference || reference.length < 4 || reference.length > 128 || !reason || reason.length < 8 || reason.length > 280) {
    throw new BadRequestException(COMMON_MESSAGE_KEYS.ERROR.VALIDATION);
  }

  return { reference, reason };
}

@ApiTags('Business Settings')
@Roles(UserRole.OWNER, UserRole.ADMIN)
@UseInterceptors(ResponseEnvelopeInterceptor)
@Controller({ path: 'partner/businesses', version: VERSION_NEUTRAL })
export class BusinessSettingsController {
  constructor(private readonly settings: SalonOwnerSettingsService) {}

  @Get()
  @ApiOperation({ operationId: 'listSalonBusinesses' })
  listBusinesses(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    return this.settings.listBusinesses({ user }, { page, pageSize });
  }

  @Post()
  @ApiOperation({ operationId: 'createSalonBusiness' })
  createBusiness(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('Idempotency-Key') idempotencyKey: string | undefined,
    @Headers('X-Support-Reference') supportReference: string | undefined,
    @Headers('X-Support-Reason') supportReason: string | undefined,
    @Body() body: SalonBusinessInputDto,
  ) {
    return this.settings.createBusiness(
      {
        user,
        idempotencyKey: readIdempotencyKey(idempotencyKey),
        supportContext: readSupportContext(user, supportReference, supportReason),
      },
      body,
    );
  }

  @Get(':businessId')
  @ApiOperation({ operationId: 'getSalonBusiness' })
  getBusiness(@CurrentUser() user: AuthenticatedUser, @Param('businessId', new ParseUUIDPipe()) businessId: string) {
    return this.settings.getBusiness({ user }, businessId);
  }

  @Patch(':businessId')
  @ApiOperation({ operationId: 'updateSalonBusiness' })
  updateBusiness(
    @CurrentUser() user: AuthenticatedUser,
    @Param('businessId', new ParseUUIDPipe()) businessId: string,
    @Headers('X-Support-Reference') supportReference: string | undefined,
    @Headers('X-Support-Reason') supportReason: string | undefined,
    @Body() body: SalonBusinessInputDto,
  ) {
    return this.settings.updateBusiness(
      { user, supportContext: readSupportContext(user, supportReference, supportReason) },
      businessId,
      body,
    );
  }
}

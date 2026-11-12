import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, UseInterceptors, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, ResponseEnvelopeInterceptor, Roles } from '@cthub-bsaas/server-core';
import { UserRole, type AuthenticatedUser } from '@cthub-bsaas/shared';

import { BusinessRoleInputDto, BusinessRoleQueryDto } from '../dto/staff-service-catalog.dto';
import { StaffService } from '../services/staff.service';

@ApiTags('Roles')
@Roles(UserRole.OWNER, UserRole.ADMIN)
@UseInterceptors(ResponseEnvelopeInterceptor)
@Controller({ path: 'partner/roles', version: VERSION_NEUTRAL })
export class RolesController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @ApiOperation({ operationId: 'listBusinessRoles' })
  listBusinessRoles(@CurrentUser() user: AuthenticatedUser, @Query() query: BusinessRoleQueryDto) {
    return this.staffService.listBusinessRoles({ user }, query);
  }

  @Post()
  @ApiOperation({ operationId: 'createBusinessRole' })
  createBusinessRole(@CurrentUser() user: AuthenticatedUser, @Body() body: BusinessRoleInputDto) {
    return this.staffService.createBusinessRole({ user }, body);
  }

  @Put(':roleId')
  @ApiOperation({ operationId: 'updateBusinessRole' })
  updateBusinessRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roleId', new ParseUUIDPipe()) roleId: string,
    @Body() body: BusinessRoleInputDto,
  ) {
    return this.staffService.updateBusinessRole({ user }, roleId, body);
  }

  @Delete(':roleId')
  @ApiOperation({ operationId: 'deleteBusinessRole' })
  deleteBusinessRole(@CurrentUser() user: AuthenticatedUser, @Param('roleId', new ParseUUIDPipe()) roleId: string) {
    return this.staffService.deleteBusinessRole({ user }, roleId);
  }
}

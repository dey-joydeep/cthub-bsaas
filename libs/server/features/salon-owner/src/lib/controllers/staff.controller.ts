import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@cthub-bsaas/server-core';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';

import {
  StaffInputDto,
  StaffLeaveBlockInputDto,
  StaffRolesInputDto,
  StaffShiftInputDto,
  StaffSkillsInputDto,
} from '../dto/staff-service-catalog.dto';
import { StaffServiceCatalogService } from '../services/staff-service-catalog.service';

@ApiTags('Staff')
@Controller('partner/staff')
export class StaffController {
  constructor(private readonly catalog: StaffServiceCatalogService) {}

  @Get()
  @ApiOperation({ operationId: 'listStaff' })
  listStaff(@CurrentUser() user: AuthenticatedUser, @Query('branchId', new ParseUUIDPipe({ optional: true })) branchId?: string) {
    return this.catalog.listStaff({ user }, branchId);
  }

  @Post()
  @ApiOperation({ operationId: 'createStaff' })
  createStaff(@CurrentUser() user: AuthenticatedUser, @Body() body: StaffInputDto) {
    return this.catalog.createStaff({ user }, body);
  }

  @Get(':staffId')
  @ApiOperation({ operationId: 'getStaff' })
  getStaff(@CurrentUser() user: AuthenticatedUser, @Param('staffId', new ParseUUIDPipe()) staffId: string) {
    return this.catalog.getStaff({ user }, staffId);
  }

  @Patch(':staffId')
  @ApiOperation({ operationId: 'updateStaff' })
  updateStaff(@CurrentUser() user: AuthenticatedUser, @Param('staffId', new ParseUUIDPipe()) staffId: string, @Body() body: StaffInputDto) {
    return this.catalog.updateStaff({ user }, staffId, body);
  }

  @Put(':staffId/roles')
  @ApiOperation({ operationId: 'replaceStaffRoles' })
  replaceStaffRoles(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Body() body: StaffRolesInputDto,
  ) {
    return this.catalog.replaceStaffRoles({ user }, staffId, body);
  }

  @Put(':staffId/skills')
  @ApiOperation({ operationId: 'replaceStaffSkills' })
  replaceStaffSkills(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Body() body: StaffSkillsInputDto,
  ) {
    return this.catalog.replaceStaffSkills({ user }, staffId, body);
  }

  @Put(':staffId/shifts')
  @ApiOperation({ operationId: 'replaceStaffShifts' })
  replaceStaffShifts(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Body() body: StaffShiftInputDto,
  ) {
    return this.catalog.replaceStaffShifts({ user }, staffId, body);
  }

  @Post(':staffId/leave-blocks')
  @ApiOperation({ operationId: 'createStaffLeaveBlock' })
  createStaffLeaveBlock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Body() body: StaffLeaveBlockInputDto,
  ) {
    return this.catalog.createStaffLeaveBlock({ user }, staffId, body);
  }
}

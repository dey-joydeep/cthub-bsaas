import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseInterceptors,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, ResponseEnvelopeInterceptor } from '@cthub-bsaas/server-core';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';

import {
  StaffIdentityDocumentInputDto,
  StaffInputDto,
  StaffLeaveBlockInputDto,
  StaffLeaveBlockQueryDto,
  StaffListQueryDto,
  StaffPersonalDetailsInputDto,
  StaffRolesInputDto,
  StaffSelfContactInputDto,
  StaffShiftInputDto,
  StaffSkillsInputDto,
  VerifyStaffIdentityDocumentInputDto,
} from '../dto/staff-service-catalog.dto';
import { StaffServiceCatalogService } from '../services/staff-service-catalog.service';

@ApiTags('Staff')
@UseInterceptors(ResponseEnvelopeInterceptor)
@Controller({ path: 'partner/staff', version: VERSION_NEUTRAL })
export class StaffController {
  constructor(private readonly catalog: StaffServiceCatalogService) {}

  @Get()
  @ApiOperation({ operationId: 'listStaff' })
  listStaff(@CurrentUser() user: AuthenticatedUser, @Query() query: StaffListQueryDto) {
    return this.catalog.listStaff({ user }, query);
  }

  @Post()
  @ApiOperation({ operationId: 'createStaff' })
  createStaff(@CurrentUser() user: AuthenticatedUser, @Body() body: StaffInputDto) {
    return this.catalog.createStaff({ user }, body);
  }

  @Put('self/contact')
  @ApiOperation({ operationId: 'selfUpdateStaffContact' })
  selfUpdateStaffContact(@CurrentUser() user: AuthenticatedUser, @Body() body: StaffSelfContactInputDto) {
    return this.catalog.selfUpdateStaffContact({ user }, body);
  }

  @Get(':staffId')
  @ApiOperation({ operationId: 'getStaff' })
  getStaff(@CurrentUser() user: AuthenticatedUser, @Param('staffId', new ParseUUIDPipe()) staffId: string) {
    return this.catalog.getStaff({ user }, staffId);
  }

  @Patch(':staffId')
  @Put(':staffId')
  @ApiOperation({ operationId: 'updateStaff' })
  updateStaff(@CurrentUser() user: AuthenticatedUser, @Param('staffId', new ParseUUIDPipe()) staffId: string, @Body() body: StaffInputDto) {
    return this.catalog.updateStaff({ user }, staffId, body);
  }

  @Get(':staffId/personal')
  @ApiOperation({ operationId: 'getStaffPersonalDetails' })
  getStaffPersonalDetails(@CurrentUser() user: AuthenticatedUser, @Param('staffId', new ParseUUIDPipe()) staffId: string) {
    return this.catalog.getStaffPersonalDetails({ user }, staffId);
  }

  @Put(':staffId/personal')
  @ApiOperation({ operationId: 'updateStaffPersonalDetails' })
  updateStaffPersonalDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Body() body: StaffPersonalDetailsInputDto,
  ) {
    return this.catalog.updateStaffPersonalDetails({ user }, staffId, body);
  }

  @Get(':staffId/documents')
  @ApiOperation({ operationId: 'listStaffIdentityDocuments' })
  listStaffIdentityDocuments(@CurrentUser() user: AuthenticatedUser, @Param('staffId', new ParseUUIDPipe()) staffId: string) {
    return this.catalog.listStaffIdentityDocuments({ user }, staffId);
  }

  @Post(':staffId/documents')
  @ApiOperation({ operationId: 'uploadStaffIdentityDocument' })
  uploadStaffIdentityDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Body() body: StaffIdentityDocumentInputDto,
  ) {
    return this.catalog.uploadStaffIdentityDocument({ user }, staffId, body);
  }

  @Put(':staffId/documents/:documentId/verify')
  @ApiOperation({ operationId: 'verifyStaffIdentityDocument' })
  verifyStaffIdentityDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Body() body: VerifyStaffIdentityDocumentInputDto,
  ) {
    return this.catalog.verifyStaffIdentityDocument({ user }, staffId, documentId, body);
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

  @Get(':staffId/leave-blocks')
  @ApiOperation({ operationId: 'listStaffLeaveBlocks' })
  listStaffLeaveBlocks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Query() query: StaffLeaveBlockQueryDto,
  ) {
    return this.catalog.listStaffLeaveBlocks({ user }, staffId, query);
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

  @Delete(':staffId/leave-blocks/:leaveBlockId')
  @ApiOperation({ operationId: 'deleteStaffLeaveBlock' })
  deleteStaffLeaveBlock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Param('leaveBlockId', new ParseUUIDPipe()) leaveBlockId: string,
  ) {
    return this.catalog.deleteStaffLeaveBlock({ user }, staffId, leaveBlockId);
  }
}

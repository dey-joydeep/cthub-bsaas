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
import { CurrentUser, ResponseEnvelopeInterceptor, Roles } from '@cthub-bsaas/server-core';
import { UserRole, type AuthenticatedUser } from '@cthub-bsaas/shared';

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
import { StaffService } from '../services/staff.service';

@ApiTags('Staff')
@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.STAFF)
@UseInterceptors(ResponseEnvelopeInterceptor)
@Controller({ path: 'partner/staff', version: VERSION_NEUTRAL })
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @ApiOperation({ operationId: 'listStaff' })
  listStaff(@CurrentUser() user: AuthenticatedUser, @Query() query: StaffListQueryDto) {
    return this.staffService.listStaff({ user }, query);
  }

  @Post()
  @ApiOperation({ operationId: 'createStaff' })
  createStaff(@CurrentUser() user: AuthenticatedUser, @Body() body: StaffInputDto) {
    return this.staffService.createStaff({ user }, body);
  }

  @Put('self/contact')
  @ApiOperation({ operationId: 'selfUpdateStaffContact' })
  selfUpdateStaffContact(@CurrentUser() user: AuthenticatedUser, @Body() body: StaffSelfContactInputDto) {
    return this.staffService.selfUpdateStaffContact({ user }, body);
  }

  @Patch(':staffId/personal/contact')
  @Put(':staffId/personal/contact')
  selfUpdateStaffContactScoped(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Body() body: StaffSelfContactInputDto,
  ) {
    return this.staffService.selfUpdateStaffContact({ user }, body, staffId);
  }

  @Get(':staffId')
  @ApiOperation({ operationId: 'getStaff' })
  getStaff(@CurrentUser() user: AuthenticatedUser, @Param('staffId', new ParseUUIDPipe()) staffId: string) {
    return this.staffService.getStaff({ user }, staffId);
  }

  @Patch(':staffId')
  @Put(':staffId')
  @ApiOperation({ operationId: 'updateStaff' })
  updateStaff(@CurrentUser() user: AuthenticatedUser, @Param('staffId', new ParseUUIDPipe()) staffId: string, @Body() body: StaffInputDto) {
    return this.staffService.updateStaff({ user }, staffId, body);
  }

  @Get(':staffId/personal')
  @ApiOperation({ operationId: 'getStaffPersonalDetails' })
  getStaffPersonalDetails(@CurrentUser() user: AuthenticatedUser, @Param('staffId', new ParseUUIDPipe()) staffId: string) {
    return this.staffService.getStaffPersonalDetails({ user }, staffId);
  }

  @Put(':staffId/personal')
  @ApiOperation({ operationId: 'updateStaffPersonalDetails' })
  updateStaffPersonalDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Body() body: StaffPersonalDetailsInputDto,
  ) {
    return this.staffService.updateStaffPersonalDetails({ user }, staffId, body);
  }

  @Get(':staffId/documents')
  @ApiOperation({ operationId: 'listStaffIdentityDocuments' })
  listStaffIdentityDocuments(@CurrentUser() user: AuthenticatedUser, @Param('staffId', new ParseUUIDPipe()) staffId: string) {
    return this.staffService.listStaffIdentityDocuments({ user }, staffId);
  }

  @Post(':staffId/documents')
  @ApiOperation({ operationId: 'uploadStaffIdentityDocument' })
  uploadStaffIdentityDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Body() body: StaffIdentityDocumentInputDto,
  ) {
    return this.staffService.uploadStaffIdentityDocument({ user }, staffId, body);
  }

  @Put(':staffId/documents/:documentId/verify')
  @ApiOperation({ operationId: 'verifyStaffIdentityDocument' })
  verifyStaffIdentityDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Param('documentId', new ParseUUIDPipe()) documentId: string,
    @Body() body: VerifyStaffIdentityDocumentInputDto,
  ) {
    return this.staffService.verifyStaffIdentityDocument({ user }, staffId, documentId, body);
  }

  @Put(':staffId/roles')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ operationId: 'replaceStaffRoles' })
  replaceStaffRoles(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Body() body: StaffRolesInputDto,
  ) {
    return this.staffService.replaceStaffRoles({ user }, staffId, body);
  }

  @Put(':staffId/skills')
  @ApiOperation({ operationId: 'replaceStaffSkills' })
  replaceStaffSkills(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Body() body: StaffSkillsInputDto,
  ) {
    return this.staffService.replaceStaffSkills({ user }, staffId, body);
  }

  @Get(':staffId/shifts')
  @ApiOperation({ operationId: 'getStaffShifts' })
  getStaffShifts(@CurrentUser() user: AuthenticatedUser, @Param('staffId', new ParseUUIDPipe()) staffId: string) {
    return this.staffService.getStaffShifts({ user }, staffId);
  }

  @Put(':staffId/shifts')
  @ApiOperation({ operationId: 'replaceStaffShifts' })
  replaceStaffShifts(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Body() body: StaffShiftInputDto,
  ) {
    return this.staffService.replaceStaffShifts({ user }, staffId, body);
  }

  @Get(':staffId/leave-blocks')
  @ApiOperation({ operationId: 'listStaffLeaveBlocks' })
  listStaffLeaveBlocks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Query() query: StaffLeaveBlockQueryDto,
  ) {
    return this.staffService.listStaffLeaveBlocks({ user }, staffId, query);
  }

  @Post(':staffId/leave-blocks')
  @ApiOperation({ operationId: 'createStaffLeaveBlock' })
  createStaffLeaveBlock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Body() body: StaffLeaveBlockInputDto,
  ) {
    return this.staffService.createStaffLeaveBlock({ user }, staffId, body);
  }

  @Delete(':staffId/leave-blocks/:leaveBlockId')
  @ApiOperation({ operationId: 'deleteStaffLeaveBlock' })
  deleteStaffLeaveBlock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('staffId', new ParseUUIDPipe()) staffId: string,
    @Param('leaveBlockId', new ParseUUIDPipe()) leaveBlockId: string,
  ) {
    return this.staffService.deleteStaffLeaveBlock({ user }, staffId, leaveBlockId);
  }
}

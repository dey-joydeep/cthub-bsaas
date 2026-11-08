import { Controller, Get, UseInterceptors, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseEnvelopeInterceptor } from '@cthub-bsaas/server-core';

import { StaffService } from '../services/staff.service';

@ApiTags('Roles')
@UseInterceptors(ResponseEnvelopeInterceptor)
@Controller({ path: 'partner/permissions', version: VERSION_NEUTRAL })
export class PermissionsController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @ApiOperation({ operationId: 'listSystemPermissions' })
  listSystemPermissions() {
    return this.staffService.listSystemPermissions();
  }
}

import { Controller, Get, UseInterceptors, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseEnvelopeInterceptor } from '@cthub-bsaas/server-core';

import { StaffServiceCatalogService } from '../services/staff-service-catalog.service';

@ApiTags('Roles')
@UseInterceptors(ResponseEnvelopeInterceptor)
@Controller({ path: 'partner/permissions', version: VERSION_NEUTRAL })
export class PermissionsController {
  constructor(private readonly catalog: StaffServiceCatalogService) {}

  @Get()
  @ApiOperation({ operationId: 'listSystemPermissions' })
  listSystemPermissions() {
    return this.catalog.listSystemPermissions();
  }
}

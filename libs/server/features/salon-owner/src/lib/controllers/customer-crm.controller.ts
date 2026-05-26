import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@cthub-bsaas/server-core';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';

import { CommunicationPreferencesInputDto, CustomerInputDto, CustomerNoteInputDto } from '../dto/customer-crm.dto';
import { CustomerCrmService } from '../services/customer-crm.service';

@ApiTags('Customers')
@Controller('partner/customers')
export class CustomerCrmController {
  constructor(private readonly customers: CustomerCrmService) {}

  @Get()
  @ApiOperation({ operationId: 'searchCustomers' })
  searchCustomers(@CurrentUser() user: AuthenticatedUser, @Query('q') search?: string) {
    return this.customers.searchCustomers({ user }, search);
  }

  @Post()
  @ApiOperation({ operationId: 'createCustomer' })
  createCustomer(@CurrentUser() user: AuthenticatedUser, @Body() body: CustomerInputDto) {
    return this.customers.createCustomer({ user }, body);
  }

  @Get(':customerId')
  @ApiOperation({ operationId: 'getCustomer' })
  getCustomer(@CurrentUser() user: AuthenticatedUser, @Param('customerId') customerId: string) {
    return this.customers.getCustomer({ user }, customerId);
  }

  @Patch(':customerId')
  @ApiOperation({ operationId: 'updateCustomer' })
  updateCustomer(@CurrentUser() user: AuthenticatedUser, @Param('customerId') customerId: string, @Body() body: CustomerInputDto) {
    return this.customers.updateCustomer({ user }, customerId, body);
  }

  @Post(':customerId/notes')
  @ApiOperation({ operationId: 'createCustomerNote' })
  createCustomerNote(@CurrentUser() user: AuthenticatedUser, @Param('customerId') customerId: string, @Body() body: CustomerNoteInputDto) {
    return this.customers.createCustomerNote({ user }, customerId, body);
  }

  @Put(':customerId/communication-preferences')
  @ApiOperation({ operationId: 'updateCustomerCommunicationPreferences' })
  updateCustomerCommunicationPreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Param('customerId') customerId: string,
    @Body() body: CommunicationPreferencesInputDto,
  ) {
    return this.customers.updateCustomerCommunicationPreferences({ user }, customerId, body);
  }

  @Get(':customerId/visit-history')
  @ApiOperation({ operationId: 'getCustomerVisitHistory' })
  getCustomerVisitHistory(@CurrentUser() user: AuthenticatedUser, @Param('customerId') customerId: string) {
    return this.customers.getCustomerVisitHistory({ user }, customerId);
  }
}

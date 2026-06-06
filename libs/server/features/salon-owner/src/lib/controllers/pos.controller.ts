import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@cthub-bsaas/server-core';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';

import { FinalizeInvoiceInputDto, InvoiceInputDto, PaymentInputDto } from '../dto/pos-inventory.dto';
import { PosInventoryService } from '../services/pos-inventory.service';

@ApiTags('POS')
@Controller('partner/pos')
export class PosController {
  constructor(private readonly pos: PosInventoryService) {}

  @Get('checkout-context')
  @ApiOperation({ operationId: 'getCheckoutContext' })
  getCheckoutContext(@CurrentUser() user: AuthenticatedUser, @Query('appointmentId') appointmentId?: string, @Query('customerId') customerId?: string) {
    return this.pos.getCheckoutContext({ user }, appointmentId, customerId);
  }

  @Post('invoices')
  @ApiOperation({ operationId: 'createInvoice' })
  createInvoice(@CurrentUser() user: AuthenticatedUser, @Body() body: InvoiceInputDto) {
    return this.pos.createInvoice({ user }, body);
  }

  @Get('invoices/:invoiceId')
  @ApiOperation({ operationId: 'getInvoice' })
  getInvoice(@CurrentUser() user: AuthenticatedUser, @Param('invoiceId') invoiceId: string) {
    return this.pos.getInvoice({ user }, invoiceId);
  }

  @Post('invoices/:invoiceId/finalize')
  @ApiOperation({ operationId: 'finalizeInvoice' })
  finalizeInvoice(@CurrentUser() user: AuthenticatedUser, @Param('invoiceId') invoiceId: string, @Body() body: FinalizeInvoiceInputDto) {
    return this.pos.finalizeInvoice({ user }, invoiceId, body);
  }

  @Post('invoices/:invoiceId/payments')
  @ApiOperation({ operationId: 'captureInvoicePayment' })
  captureInvoicePayment(@CurrentUser() user: AuthenticatedUser, @Param('invoiceId') invoiceId: string, @Body() body: PaymentInputDto) {
    return this.pos.captureInvoicePayment({ user }, invoiceId, body);
  }

  @Get('pending-dues')
  @ApiOperation({ operationId: 'listPendingDues' })
  listPendingDues(@CurrentUser() user: AuthenticatedUser, @Query('branchId') branchId?: string) {
    return this.pos.listPendingDues({ user }, branchId);
  }
}

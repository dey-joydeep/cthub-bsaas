import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@cthub-bsaas/server-core';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';

import { ProductInputDto, StockMovementInputDto } from '../dto/pos-inventory.dto';
import { PosInventoryService } from '../services/pos-inventory.service';

@ApiTags('Inventory')
@Controller('partner/inventory')
export class InventoryController {
  constructor(private readonly inventory: PosInventoryService) {}

  @Get('products')
  @ApiOperation({ operationId: 'listProducts' })
  listProducts(@CurrentUser() user: AuthenticatedUser, @Query('q') search?: string) {
    return this.inventory.listProducts({ user }, search);
  }

  @Post('products')
  @ApiOperation({ operationId: 'createProduct' })
  createProduct(@CurrentUser() user: AuthenticatedUser, @Body() body: ProductInputDto) {
    return this.inventory.createProduct({ user }, body);
  }

  @Get('products/:productId')
  @ApiOperation({ operationId: 'getProduct' })
  getProduct(@CurrentUser() user: AuthenticatedUser, @Param('productId') productId: string) {
    return this.inventory.getProduct({ user }, productId);
  }

  @Patch('products/:productId')
  @ApiOperation({ operationId: 'updateProduct' })
  updateProduct(@CurrentUser() user: AuthenticatedUser, @Param('productId') productId: string, @Body() body: ProductInputDto) {
    return this.inventory.updateProduct({ user }, productId, body);
  }

  @Get('branch-stock')
  @ApiOperation({ operationId: 'listBranchStock' })
  listBranchStock(@CurrentUser() user: AuthenticatedUser, @Query('branchId') branchId: string) {
    return this.inventory.listBranchStock({ user }, branchId);
  }

  @Post('stock-movements')
  @ApiOperation({ operationId: 'createStockMovement' })
  createStockMovement(@CurrentUser() user: AuthenticatedUser, @Body() body: StockMovementInputDto) {
    return this.inventory.createStockMovement({ user }, body);
  }

  @Post('products/:productId/adjust-stock')
  @ApiOperation({ operationId: 'adjustProductStock' })
  adjustProductStock(@CurrentUser() user: AuthenticatedUser, @Param('productId') productId: string, @Body() body: StockMovementInputDto) {
    return this.inventory.adjustProductStock({ user }, productId, body);
  }

  @Get('low-stock-alerts')
  @ApiOperation({ operationId: 'listLowStockAlerts' })
  listLowStockAlerts(@CurrentUser() user: AuthenticatedUser, @Query('branchId') branchId: string) {
    return this.inventory.listLowStockAlerts({ user }, branchId);
  }
}

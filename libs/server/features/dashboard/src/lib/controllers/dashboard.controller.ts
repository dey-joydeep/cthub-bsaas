import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { ProductSalesFilterDto } from '../dto/product-sales.dto';
import { JwtAuthGuard, Roles, RolesGuard, StrongAuthGuard, User } from '@cthub-bsaas/server-core';
import { AppUserRole } from '../../appointment/models/user-params.model';
import type { AuthUser } from '../interfaces/dashboard-request.interface';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard, StrongAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER)
  async getDashboardStats(@User() _user: AuthUser) {
    return this.dashboardService.getStats();
  }

  @Get('subscriptions')
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER)
  async getSubscriptions(@User() _user: AuthUser) {
    return this.dashboardService.getSubscriptions();
  }

  @Get('revenue')
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER)
  async getRevenue(@User() _user: AuthUser, @Query() filter: { startDate?: string; endDate?: string }) {
    // TODO: Use the user parameter for authorization if needed
    return this.dashboardService.getRevenue({
      startDate: filter.startDate,
      endDate: filter.endDate,
    });
  }

  @Get('renewals')
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER)
  async getRenewals() {
    return this.dashboardService.getRenewals();
  }

  @Get('product-sales')
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER, AppUserRole.STAFF)
  async getProductSales(@Query() filters: ProductSalesFilterDto) {
    return this.dashboardService.getProductSales(filters);
  }

  @Get('product-sales-summary')
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER)
  async getProductSalesSummary(@Query() filters: ProductSalesFilterDto) {
    return this.dashboardService.getProductSalesSummary(filters);
  }

  @Get('top-selling-products')
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER, AppUserRole.STAFF)
  async getTopSellingProducts(@Query('limit') limit = 5) {
    return this.dashboardService.getTopSellingProducts(limit);
  }
}

// All endpoints are now handled by the class methods above

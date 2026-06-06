import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@cthub-bsaas/server-core';

import { PublicAvailabilityQueryDto, PublicHomeQueryDto, PublicSalonSearchQueryDto } from '../dto/public-discovery.dto';
import { PublicDiscoveryService } from '../services/public-discovery.service';

@Public()
@ApiTags('Public Discovery')
@Controller('public')
export class PublicDiscoveryController {
  constructor(private readonly publicDiscovery: PublicDiscoveryService) {}

  @Get('home')
  @ApiOperation({ operationId: 'getPublicHome' })
  getPublicHome(@Query() query: PublicHomeQueryDto) {
    return this.publicDiscovery.getPublicHome(query);
  }

  @Get('salons')
  @ApiOperation({ operationId: 'searchPublicSalons' })
  searchPublicSalons(@Query() query: PublicSalonSearchQueryDto) {
    return this.publicDiscovery.searchPublicSalons(query);
  }

  @Get('salons/:slug')
  @ApiOperation({ operationId: 'getPublicSalonProfile' })
  getPublicSalonProfile(@Param('slug') slug: string) {
    return this.publicDiscovery.getPublicSalonProfile(slug);
  }

  @Get('salons/:slug/services')
  @ApiOperation({ operationId: 'listPublicSalonServices' })
  listPublicSalonServices(@Param('slug') slug: string) {
    return this.publicDiscovery.listPublicSalonServices(slug);
  }

  @Get('salons/:slug/reviews')
  @ApiOperation({ operationId: 'listPublicSalonReviews' })
  listPublicSalonReviews(@Param('slug') slug: string, @Query('limit') limit?: string) {
    return this.publicDiscovery.listPublicSalonReviews(slug, limit ? Number(limit) : undefined);
  }

  @Get('salons/:slug/portfolio')
  @ApiOperation({ operationId: 'listPublicSalonPortfolio' })
  listPublicSalonPortfolio(@Param('slug') slug: string) {
    return this.publicDiscovery.listPublicSalonPortfolio(slug);
  }

  @Get('salons/:slug/availability')
  @ApiOperation({ operationId: 'getPublicAvailabilitySignal' })
  getPublicAvailabilitySignal(@Param('slug') slug: string, @Query() query: PublicAvailabilityQueryDto) {
    return this.publicDiscovery.getPublicAvailabilitySignal(slug, query);
  }
}

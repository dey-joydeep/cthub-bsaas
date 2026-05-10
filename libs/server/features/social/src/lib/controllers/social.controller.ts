import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Req, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SocialService } from '../services/social.service';
import { CreateSocialDto } from '../dto/requests/create-social.dto';
import { UpdateSocialDto } from '../dto/requests/update-social.dto';
import { SocialResponseDto } from '../dto/responses/social-response.dto';
import { JwtAuthGuard, RolesGuard, Roles } from '@cthub-bsaas/server-core';
import { AppUserRole } from '@shared/types/user.types';

@ApiTags('social')
@Controller('social')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post()
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER, AppUserRole.STAFF, AppUserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a new social link' })
  @ApiResponse({ status: HttpStatus.CREATED, type: SocialResponseDto })
  async create(@Body() createSocialDto: CreateSocialDto, @Req() req: any): Promise<SocialResponseDto> {
    return this.socialService.createSocial({ ...createSocialDto, userId: req.user?.id });
  }

  @Get()
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER, AppUserRole.STAFF, AppUserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get all social links' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiResponse({ status: HttpStatus.OK, type: [SocialResponseDto] })
  async findAll(@Query() query: any): Promise<SocialResponseDto[]> {
    return this.socialService.getSocials(query);
  }

  @Get(':id')
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER, AppUserRole.STAFF, AppUserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get a social link by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: SocialResponseDto })
  async findOne(@Param('id') id: string): Promise<SocialResponseDto> {
    return this.socialService.getSocialById({ id });
  }

  @Post(':id')
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER, AppUserRole.STAFF, AppUserRole.CUSTOMER)
  @ApiOperation({ summary: 'Update a social link' })
  @ApiResponse({ status: HttpStatus.OK, type: SocialResponseDto })
  async update(@Param('id') id: string, @Body() updateSocialDto: UpdateSocialDto): Promise<SocialResponseDto> {
    return this.socialService.updateSocial({ id, data: updateSocialDto });
  }

  @Delete(':id')
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER, AppUserRole.STAFF, AppUserRole.CUSTOMER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a social link' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async remove(@Param('id') id: string): Promise<void> {
    await this.socialService.deleteSocial({ id });
  }

  @Get('auth/google')
  @ApiOperation({ summary: 'Google OAuth login' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Google login endpoint' })
  googleAuth() {
    return { message: 'Google login endpoint' };
  }

  @Get('auth/facebook')
  @ApiOperation({ summary: 'Facebook OAuth login' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Facebook login endpoint' })
  facebookAuth() {
    return { message: 'Facebook login endpoint' };
  }
}

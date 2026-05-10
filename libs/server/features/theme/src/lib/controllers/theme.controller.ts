import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../../common/decorators/api-paginated-response.decorator';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { Role } from '../../../common/enums/role.enum';
import { Roles, JwtAuthGuard, RolesGuard } from '@cthub-bsaas/server-core';
import { CreateThemeDto } from '../dto/create-theme.dto';
import { ThemeQueryDto } from '../dto/theme-query.dto';
import { ThemeResponseDto } from '../dto/theme-response.dto';
import { UpdateThemeDto } from '../dto/update-theme.dto';
import { ThemeService } from '../services/theme.service';

@ApiTags('Themes')
@ApiBearerAuth()
@Controller('themes')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get()
  @Roles(Role.ADMIN, Role.OWNER, Role.STAFF, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get all themes with optional filtering' })
  @ApiPaginatedResponse(ThemeResponseDto)
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  async findAll(@Query() query: ThemeQueryDto): Promise<PaginatedResponseDto<ThemeResponseDto>> {
    return this.themeService.findAll(query);
  }

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new theme' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Theme created successfully', type: ThemeResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Admin access required' })
  async create(@Body() createThemeDto: CreateThemeDto): Promise<ThemeResponseDto> {
    return this.themeService.create(createThemeDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update an existing theme' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Theme updated successfully', type: ThemeResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Theme not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Admin access required' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateThemeDto: UpdateThemeDto): Promise<ThemeResponseDto> {
    return this.themeService.update(id, updateThemeDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a theme' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Theme deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Theme not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Admin access required' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.themeService.remove(id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.OWNER, Role.STAFF, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get a theme by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Theme found', type: ThemeResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Theme not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ThemeResponseDto> {
    return this.themeService.findOne(id);
  }
}

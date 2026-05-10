import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

// Core imports
import { AuthUser, User } from '@cthub-bsaas/server-core';
import { JwtAuthGuard, Roles, RolesGuard } from '@cthub-bsaas/server-core';

// Feature imports
import { CreateAppointmentDto, FilterAppointmentsDto } from '../dto/requests';
import { AppointmentDetailsDto, AppointmentResponseDto, AppointmentStatsDto, PaginatedAppointmentsDto } from '../dto/responses';
import { AppUserRole } from '@cthub-bsaas/shared';
import { AppointmentService } from '../services/appointment.service';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@ApiBearerAuth()
@ApiTags('Appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER, AppUserRole.STAFF, AppUserRole.CUSTOMER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new appointment',
    description: 'Creates a new appointment with the provided details.',
  })
  @ApiCreatedResponse({
    description: 'Appointment successfully created',
    type: AppointmentDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized: Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden: Insufficient permissions',
  })
  async create(@Body() createAppointmentDto: CreateAppointmentDto, @User() user: AuthUser): Promise<AppointmentDetailsDto> {
    // Customers can only create appointments for themselves
    if (user.roles.some((role) => role.name === AppUserRole.CUSTOMER)) {
      createAppointmentDto.customerId = user.id;
    }

    return this.appointmentService.createAppointment(createAppointmentDto, user);
  }

  @Get()
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER, AppUserRole.STAFF, AppUserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Get all appointments',
    description: 'Returns a paginated list of appointments based on the provided filters.',
  })
  @ApiOkResponse({
    description: 'Successfully retrieved appointments',
    type: PaginatedAppointmentsDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized: Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden: Insufficient permissions',
  })
  async findAll(@Query() filterDto: FilterAppointmentsDto, @User() user: AuthUser): Promise<PaginatedAppointmentsDto> {
    // Non-admin users can only see their own appointments
    if (user.roles.some((role) => role.name === AppUserRole.CUSTOMER)) {
      filterDto.customerId = user.id;
    } else if (user.roles.some((role) => role.name === AppUserRole.STAFF)) {
      filterDto.staffId = user.id;
    }

    return this.appointmentService.findAllAppointments(filterDto);
  }

  @Get('overview')
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER, AppUserRole.STAFF, AppUserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Get appointments overview with statistics',
    description: 'Returns an overview of appointments with statistics based on the provided filters.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved appointments overview',
    type: AppointmentStatsDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to access this resource',
  })
  @ApiQuery({
    name: 'filters',
    type: FilterAppointmentsDto,
    required: false,
    description: 'Filter criteria for appointments',
  })
  async getAppointmentsOverview(@Query() filter: Partial<FilterAppointmentsDto>, @User() user: AuthUser): Promise<AppointmentStatsDto> {
    // Create a new filter instance with default values
    const filterDto = new FilterAppointmentsDto();
    Object.assign(filterDto, filter);

    return this.appointmentService.getAppointmentsOverview(filterDto, user.id);
  }

  @Get('user')
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER, AppUserRole.STAFF, AppUserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Get appointments for the authenticated user',
    description:
      "Retrieves a list of appointments for the authenticated user. Admin/owner/staff can access any user's appointments by providing a userId query parameter.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved user appointments',
    type: [AppointmentResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to access these appointments',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiQuery({
    name: 'filters',
    type: FilterAppointmentsDto,
    required: false,
    description: 'Optional filter criteria for appointments',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Optional user ID to get appointments for (admin/owner/staff only)',
  })
  async getUserAppointments(
    @User() user: AuthUser,
    @Query('userId') targetUserId?: string,
    @Query() filters: Partial<FilterAppointmentsDto> = {} as Partial<FilterAppointmentsDto>,
  ): Promise<AppointmentResponseDto[]> {
    // If no targetUserId is provided, default to the current user's ID
    const userId = targetUserId || user.id;

    // If a user is trying to access another user's appointments, check permissions
    if (userId !== user.id) {
      const hasPermission = user.roles.some((role) =>
        [AppUserRole.ADMIN, AppUserRole.OWNER, AppUserRole.STAFF].includes(role.name as AppUserRole),
      );

      if (!hasPermission) {
        throw new ForbiddenException('You do not have permission to view these appointments');
      }
    }

    // Create a new filter instance with default values
    const filterDto = new FilterAppointmentsDto();
    Object.assign(filterDto, filters);

    return this.appointmentService.getAppointmentsByUser(userId, filterDto);
  }

  @Get('tenant/:tenantId')
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER, AppUserRole.STAFF, AppUserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Get appointments for a specific tenant',
    description: 'Retrieves a list of appointments for a specific tenant with optional filtering.',
  })
  @ApiParam({ name: 'tenantId', description: 'The ID of the tenant to get appointments for' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved tenant appointments',
    type: [AppointmentResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to access this resource',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tenant not found',
  })
  async getTenantAppointments(
    @Param('tenantId') tenantId: string,
    @Query() filters: Partial<FilterAppointmentsDto> = {},
    @User() user: AuthUser,
  ): Promise<AppointmentResponseDto[]> {
    // Create a new filter instance with default values
    const filterDto = new FilterAppointmentsDto();
    Object.assign(filterDto, filters);

    // For customers, only show their own appointments for this tenant
    if (user.roles.some((role) => role.name === AppUserRole.CUSTOMER)) {
      filterDto.customerId = user.id;
      return this.appointmentService.getAppointmentsByUser(user.id, filterDto);
    }

    // For admin/owner/staff, show all appointments for the tenant
    return this.appointmentService.getTenantAppointments(tenantId, filterDto);
  }

  @Get('eligible-to-review/:tenantId')
  @Roles(AppUserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Check if user is eligible to review a tenant',
    description:
      'Determines if a user is eligible to leave a review for a specific tenant based on past appointments and existing reviews.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Eligibility status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        eligible: { type: 'boolean', description: 'Whether the user is eligible to review the tenant' },
        message: { type: 'string', description: 'Optional message explaining the eligibility status' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to access this resource',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User or tenant not found',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user to check eligibility for',
    type: String,
  })
  @ApiParam({
    name: 'tenantId',
    description: 'ID of the tenant to check review eligibility for',
    type: String,
  })
  async getUserEligibleToReview(
    @Param('userId') userId: string,
    @Param('tenantId') tenantId: string,
    @User() user: AuthUser,
  ): Promise<{ eligible: boolean; message?: string }> {
    // Only allow users to check their own eligibility or admins to check any user
    const isAdmin = user.roles.some((role) => role.name === AppUserRole.ADMIN);
    if (!isAdmin && user.id !== userId) {
      throw new ForbiddenException('You do not have permission to check review eligibility for this user');
    }

    return this.appointmentService.checkUserEligibleToReview(userId, tenantId);
  }

  // @Post()
  // @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.STAFF, UserRole.CUSTOMER)
  // @ApiOperation({ summary: 'Create a new appointment' })
  // @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  // @ApiResponse({ status: 400, description: 'Bad request' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 403, description: 'Forbidden' })
  // async createAppointment(
  //   @Body() createAppointmentDto: CreateAppointmentDto
  // ): Promise<AppointmentWithDetails> {
  //   try {
  //     return await this.appointmentService.createAppointment(createAppointmentDto);
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       throw new BadRequestException(error.message);
  //     }
  //     throw error;
  //   }
  // }
}

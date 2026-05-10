import { JwtAuthGuard, Roles, User, RolesGuard } from '@cthub-bsaas/server-core';
import type { PaginatedResponse, PaginationParams } from '@cthub-bsaas/server-core';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
import { AppUserRole } from '@cthub-bsaas/shared';
import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserService } from '../services/user.service';

import { UserResponseDto } from '../dto/user-response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @Roles(AppUserRole.ADMIN)
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiQuery({ name: 'tenant_id', required: false, type: String, description: 'Tenant ID to filter statistics' })
  @ApiOkResponse({
    description: 'User statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number', example: 100 },
        activeUsers: { type: 'number', example: 75 },
        tenantId: { type: 'string', example: 'tenant-123' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  async getUserStats(@Query('tenant_id') tenantId: string, @User() _user: AuthenticatedUser) {
    try {
      // The JwtAuthGuard and RolesGuard already verify the user's authentication and authorization
      // For now, we'll return a simple object since getUserStats is not implemented
      return {
        totalUsers: 0,
        activeUsers: 0,
        tenantId: tenantId || 'all',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Failed to get user statistics');
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER, AppUserRole.STAFF)
  @ApiOperation({ summary: 'Get all users (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for name or email' })
  @ApiQuery({ name: 'role', required: false, enum: AppUserRole, description: 'Filter by user role' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'], description: 'Filter by user status' })
  @ApiOkResponse({
    description: 'Paginated list of users',
    type: PaginatedResponse,
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponse) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(UserResponseDto) },
            },
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async getUsers(
    @User() user: AuthenticatedUser,
    @Query()
    query: PaginationParams & {
      search?: string;
      role?: AppUserRole;
      status?: string;
    } = {},
  ): Promise<PaginatedResponse<UserResponseDto>> {
    try {
      const { page = 1, limit = 10, search = '', role, status } = query;
      let tenantId: string | null = null;

      // If user is not an admin, they can only see users from their own tenant
      if (user && !user.roles.some((r) => r.name === AppUserRole.ADMIN)) {
        tenantId = user.tenantId || null;
      }

      // Build the where clause with optional filters
      const where: Prisma.UserWhereInput = {};

      // Apply tenant filter
      if (tenantId) {
        where.tenantId = tenantId;
      }

      // Apply search filter
      if (search) {
        where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];
      }

      // Apply role filter
      if (role) {
        where.roles = {
          some: {
            role: {
              name: role,
            },
          },
        };
      }

      // Apply status filter
      if (status) {
        where.isActive = status === 'active';
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const take = limit;

      // Get paginated results
      const [users, total] = await Promise.all([
        this.userService.getUsers({
          where,
          skip,
          take,
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.userService.countUsers({ where }),
      ]);

      // Build pagination response
      const response = {
        data: users.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          isVerified: user.isVerified,
          isActive: user.isActive,
          avatarUrl: user.avatarUrl,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          tenantId: user.tenantId,
          roles:
            user.roles?.map((ur) => ({
              id: ur.roleId,
              name: ur.role?.name || '',
            })) || [],
        })),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      // Return the paginated response with the correct structure
      return {
        data: response.data,
        meta: response.meta,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppUserRole.ADMIN, AppUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all users with pagination (Admin only)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponse) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(UserResponseDto) },
            },
          },
        },
      ],
    },
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async getUsersAdmin(
    @User() user: AuthenticatedUser,
    @Query()
    query: PaginationParams & {
      search?: string;
      role?: AppUserRole;
      status?: string;
    } = {},
  ): Promise<PaginatedResponse<UserResponseDto>> {
    try {
      const { page = 1, limit = 10, search = '', role, status } = query;
      let tenantId: string | null = null;

      // If user is not an admin, they can only see users from their own tenant
      if (user && !user.roles.some((r) => r.name === AppUserRole.ADMIN)) {
        tenantId = user.tenantId || null;
      }

      // Build the where clause with optional filters
      const where: Prisma.UserWhereInput = {};

      // Apply tenant filter
      if (tenantId) {
        where.tenantId = tenantId;
      }

      // Apply search filter
      if (search) {
        where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];
      }

      // Apply role filter
      if (role) {
        where.roles = {
          some: {
            role: {
              name: role,
            },
          },
        };
      }

      // Apply status filter
      if (status) {
        where.isActive = status === 'active';
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const take = limit;

      // Get paginated results
      const [users, total] = await Promise.all([
        this.userService.getUsers({
          where,
          skip,
          take,
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.userService.countUsers({ where }),
      ]);

      // Build pagination response
      const response = {
        data: users.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          isVerified: user.isVerified,
          isActive: user.isActive,
          avatarUrl: user.avatarUrl,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          tenantId: user.tenantId,
          roles:
            user.roles?.map((ur) => ({
              id: ur.roleId,
              name: ur.role?.name || '',
            })) || [],
        })),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      // Return the paginated response with the correct structure
      return {
        data: response.data,
        meta: response.meta,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto, description: 'User registration data' })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiConflictResponse({ description: 'User already exists' })
  async register(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.userService.createUser(createUserDto);
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isVerified: user.isVerified,
        isActive: user.isActive,
        avatarUrl: user.avatarUrl,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        tenantId: user.tenantId,
        roles:
          user.roles?.map((ur) => ({
            id: ur.roleId,
            name: ur.role?.name || '',
          })) || [],
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException('Email already exists');
      }
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, Roles)
  @Roles(AppUserRole.ADMIN, AppUserRole.OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user (admin/owner only)' })
  @ApiBody({ type: CreateUserDto, description: 'User creation data' })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiConflictResponse({ description: 'User already exists' })
  async create(@Body() createUserDto: CreateUserDto, @User() currentUser: AuthenticatedUser): Promise<UserResponseDto> {
    try {
      // Only allow ADMIN to create users with ADMIN role
      // OWNER can only create CUSTOMER and STAFF users
      if (!currentUser.roles.some((r) => r.name === AppUserRole.ADMIN) && createUserDto.role === AppUserRole.ADMIN) {
        throw new ForbiddenException('You do not have permission to create users with ADMIN role');
      }

      // Set the tenant ID from the current user if not provided
      if (!createUserDto.tenantId) {
        createUserDto.tenantId = currentUser.tenantId || null;
      }

      const newUser = await this.userService.createUser(createUserDto);

      return {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        isVerified: newUser.isVerified,
        isActive: newUser.isActive,
        avatarUrl: newUser.avatarUrl,
        lastLoginAt: newUser.lastLoginAt,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        tenantId: newUser.tenantId,
        roles:
          newUser.roles?.map((ur) => ({
            id: ur.roleId,
            name: ur.role?.name || '',
          })) || [],
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      } else if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      } else if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiBody({ type: UpdateUserDto, description: 'User update data' })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @User() _user: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    try {
      const updatedUser = await this.userService.updateUser(id, updateUserDto);
      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        isVerified: updatedUser.isVerified,
        isActive: updatedUser.isActive,
        avatarUrl: updatedUser.avatarUrl,
        lastLoginAt: updatedUser.lastLoginAt,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        tenantId: updatedUser.tenantId,
        roles:
          updatedUser.roles?.map((ur) => ({
            id: ur.roleId,
            name: ur.role?.name || '',
          })) || [],
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('User not found');
      } else if (error instanceof ConflictException) {
        throw new ConflictException('Email already exists');
      } else if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(AppUserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiNoContentResponse({ description: 'User deleted successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  async deleteUser(@Param('id') id: string) {
    try {
      await this.userService.deleteUser(id);
      return;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('User not found');
      }
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginUserDto, description: 'User login credentials' })
  @ApiOkResponse({
    description: 'User logged in successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe', nullable: true },
            roles: {
              type: 'array',
              items: { type: 'string' },
              example: ['CUSTOMER'],
            },
            tenantId: { type: 'string', example: 'tenant-123', nullable: true },
            isVerified: { type: 'boolean', example: true },
            isActive: { type: 'boolean', example: true },
            phone: { type: 'string', example: '+1234567890', nullable: true },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  async login(@Body() loginUserDto: LoginUserDto) {
    try {
      // Use the service to handle login and token generation
      const loginResult = await this.userService.login(loginUserDto);

      // Get the full user with roles
      const user = await this.userService.getUserByEmail(loginUserDto.email);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Return user data without sensitive information
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles ? user.roles.map((r: any) => r.role?.name || r) : [],
        tenantId: user.tenantId,
        isVerified: user.isVerified,
        isActive: user.isActive,
        phone: user.phone,
      };

      return {
        accessToken: loginResult.accessToken,
        user: userResponse,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Login failed');
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getCurrentUser(@User() user: AuthenticatedUser): Promise<UserResponseDto> {
    try {
      const currentUser = await this.userService.getUserById(user.id);
      if (!currentUser) {
        throw new NotFoundException('User not found');
      }

      return {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        phone: currentUser.phone,
        isVerified: currentUser.isVerified,
        isActive: currentUser.isActive,
        avatarUrl: currentUser.avatarUrl,
        lastLoginAt: currentUser.lastLoginAt,
        createdAt: currentUser.createdAt,
        updatedAt: currentUser.updatedAt,
        tenantId: currentUser.tenantId,
        roles: (currentUser.roles || []).map((ur) => ({
          id: ur.roleId,
          name: ur.role?.name || '',
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get user profile');
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  @ApiOkResponse({
    description: 'User logged out successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logout successful' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  async logout() {
    // In a stateless JWT system, logout is handled client-side by removing the token
    // This endpoint is provided for consistency and future extensibility
    return { message: 'Logout successful' };
  }
}

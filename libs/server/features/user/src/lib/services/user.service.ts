import { AppUserRole } from '@cthub-bsaas/shared';
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

// Define the UserRole enum if not available from @prisma/client
enum UserRole {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}

interface UserBase {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  isVerified: boolean;
  isActive: boolean;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string | null;
  passwordHash: string;
}

interface UserWithRoles extends UserBase {
  roles: Array<{
    role: {
      id: number;
      name: UserRole;
    };
    userId: string;
    roleId: number;
  }>;
  saasOwner?: any;
  salonStaff?: any;
  customer?: any;
}

// User type is now an alias for UserWithRoles to ensure consistency
type User = UserWithRoles;

@Injectable()
export class UserService {
  private readonly prisma: PrismaClient;

  constructor(
    @Inject(forwardRef(() => JwtService))
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.prisma = new PrismaClient();
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create a new object with the required User properties
    const userWithRoles = user as unknown as User;
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
      passwordHash: user.passwordHash, // Include passwordHash to satisfy the type
      roles: userWithRoles.roles || [],
    };
  }

  async login(loginDto: LoginUserDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const roles = user.roles?.map((userRole) => userRole.role.name) || [];

    return {
      accessToken: this.generateToken({
        id: user.id,
        email: user.email,
        roles,
      }),
    };
  }

  private generateToken(user: { id: string; email: string; roles: string[] }): string {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '1d',
    });
  }

  async countUsers(where?: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({
      where,
    });
  }

  async getUsers(
    params: {
      where?: Prisma.UserWhereInput;
      skip?: number;
      take?: number;
      orderBy?: Prisma.UserOrderByWithRelationInput;
      include?: Prisma.UserInclude;
    } = {},
  ): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        saasOwner: true,
        salonStaff: true,
        customer: true,
      },
    });

    return users.map((user) => {
      // Map the roles to the expected format
      const mappedRoles =
        user.roles?.map((ur) => ({
          role: {
            id: ur.roleId,
            name: ur.role?.name || '',
          },
          userId: user.id,
          roleId: ur.roleId,
        })) || [];

      // Create a properly typed user object with all required fields
      const userWithRoles: UserWithRoles = {
        ...user,
        // Ensure all required fields are present with proper types
        name: user.name || null,
        phone: user.phone || null,
        isVerified: user.isVerified ?? false,
        isActive: user.isActive ?? true,
        avatarUrl: user.avatarUrl || null,
        lastLoginAt: user.lastLoginAt || null,
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date(),
        tenantId: user.tenantId || null,
        roles: mappedRoles,
        saasOwner: user.saasOwner || undefined,
        salonStaff: user.salonStaff || undefined,
        customer: user.customer || undefined,
      };

      return userWithRoles;
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const userWithRoles = user as unknown as UserWithRoles;
    return {
      ...user,
      roles:
        userWithRoles.roles?.map((ur) => ({
          role: ur.role,
          userId: ur.userId,
          roleId: ur.roleId,
        })) || [],
    };
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.getUserByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this.hashPassword(createUserDto.password);

    // Start a transaction to ensure data consistency
    return this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          passwordHash: hashedPassword,
          phone: createUserDto.phone || null,
          tenantId: createUserDto.tenantId || null,
          isVerified: false,
          isActive: true,
        },
      });

      try {
        // Assign roles
        const roleName = createUserDto.role || AppUserRole.CUSTOMER;
        const role = await prisma.role.findUnique({
          where: { name: roleName },
        });

        if (!role) {
          throw new BadRequestException(`Invalid role: ${roleName}`);
        }

        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
          },
        });

        // Return the created user with roles
        const userWithRoles = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        });

        if (!userWithRoles) {
          throw new Error('Failed to create user');
        }

        const typedUser = userWithRoles as unknown as UserWithRoles;
        return {
          ...typedUser,
          roles:
            typedUser.roles?.map((ur) => ({
              role: ur.role,
              userId: ur.userId,
              roleId: ur.roleId,
            })) || [],
        };
      } catch (error) {
        // If anything fails, delete the created user to maintain consistency
        await prisma.user.delete({ where: { id: user.id } });
        throw error;
      }
    });
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        saasOwner: true,
        salonStaff: true,
        customer: true,
      },
    });

    if (!user) {
      return null;
    }

    const userWithRoles = user as unknown as UserWithRoles;
    return {
      ...user,
      roles:
        userWithRoles.roles?.map((ur) => ({
          role: ur.role,
          userId: ur.userId,
          roleId: ur.roleId,
        })) || [],
    };
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Start a transaction to ensure data consistency
    return this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          roles: {
            include: { role: true },
          },
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Check if email is being updated and if it's already taken
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: updateUserDto.email },
        });
        if (existingUser) {
          throw new ConflictException('Email already in use');
        }
      }

      // Handle password update if provided
      if (updateUserDto.password) {
        if (!updateUserDto.currentPassword) {
          throw new BadRequestException('Current password is required to update password');
        }

        const isPasswordValid = await this.validateUser(user.email, updateUserDto.currentPassword);
        if (!isPasswordValid) {
          throw new UnauthorizedException('Invalid current password');
        }

        updateUserDto.password = await this.hashPassword(updateUserDto.password);
        delete updateUserDto.currentPassword;
      } else if (updateUserDto.currentPassword) {
        throw new BadRequestException('New password is required when providing current password');
      }

      // Prepare update data
      const updateData: Prisma.UserUpdateInput = {
        email: updateUserDto.email,
        name: updateUserDto.name,
        phone: updateUserDto.phone,
        isActive: updateUserDto.isActive,
        isVerified: updateUserDto.isVerified,
      };

      // Handle tenant update if provided
      if (updateUserDto.tenantId !== undefined) {
        if (updateUserDto.tenantId === null) {
          // Disconnect tenant if tenantId is explicitly set to null
          updateData.tenantId = null;
        } else if (typeof updateUserDto.tenantId === 'string') {
          // Connect to the specified tenant
          updateData.tenantId = updateUserDto.tenantId;
        }
      }

      // Only include password if it's being updated
      if (updateUserDto.password) {
        updateData.passwordHash = updateUserDto.password;
      }

      // Update user data
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      // Handle role update if provided
      if (updateUserDto.role) {
        // First, remove all existing roles
        await prisma.userRole.deleteMany({
          where: { userId: id },
        });

        // Find the new role
        const role = await prisma.role.findUnique({
          where: { name: updateUserDto.role },
        });

        if (!role) {
          throw new BadRequestException(`Invalid role: ${updateUserDto.role}`);
        }

        // Add the new role
        await prisma.userRole.create({
          data: {
            userId: id,
            roleId: role.id,
          },
        });

        // Refetch user with updated roles
        const userWithUpdatedRoles = await prisma.user.findUnique({
          where: { id },
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        });

        if (!userWithUpdatedRoles) {
          throw new Error('Failed to update user');
        }

        const typedUser = userWithUpdatedRoles as unknown as UserWithRoles;
        return {
          ...typedUser,
          roles:
            typedUser.roles?.map((ur) => ({
              role: ur.role,
              userId: ur.userId,
              roleId: ur.roleId,
            })) || [],
        };
      }

      const typedUser = updatedUser as unknown as UserWithRoles;
      return {
        ...typedUser,
        roles:
          typedUser.roles?.map((ur) => ({
            role: ur.role,
            userId: ur.userId,
            roleId: ur.roleId,
          })) || [],
      };
    });
  }

  async validateCredentials(email: string, password: string): Promise<boolean> {
    try {
      await this.validateUser(email, password);
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteUser(id: string): Promise<void> {
    // Use a transaction to ensure data consistency
    await this.prisma.$transaction(async (prisma) => {
      // First, check if the user exists
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          roles: true,
          saasOwner: true,
          salonStaff: true,
          customer: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Delete related records first to maintain referential integrity
      if (user.roles && user.roles.length > 0) {
        await prisma.userRole.deleteMany({
          where: { userId: id },
        });
      }

      // Delete the user
      await prisma.user.delete({
        where: { id },
      });
    });
  }
}

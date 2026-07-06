import { Injectable } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { IUserRepository } from '@cthub-bsaas/server-contracts-auth';

/**
 * @public
 * Prisma-backed implementation of {@link IUserRepository}.
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @inheritdoc
   */
  findById(id: string): Promise<(User & { roles: { role: { name: string } }[] }) | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: { select: { name: true } },
          },
        },
      },
    });
  }

  /**
   * @inheritdoc
   */
  findByEmail(email: string): Promise<(User & { roles: { role: { name: string } }[] }) | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              select: { name: true },
            },
          },
        },
      },
    });
  }

  /**
   * @inheritdoc
   */
  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  /**
   * @inheritdoc
   */
  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}

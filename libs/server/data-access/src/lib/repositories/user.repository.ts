import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
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
    async findById(id: string): Promise<(User & { roles: { role: { name: string } }[] }) | null> {
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
    async findByEmail(email: string): Promise<(User & { roles: { role: { name: string } }[] }) | null> {
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
    async create(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({ data });
    }

    /**
     * @inheritdoc
     */
    async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }
}

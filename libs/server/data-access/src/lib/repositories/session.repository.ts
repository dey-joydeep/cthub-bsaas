import { Injectable } from '@nestjs/common';
import { Prisma, Session } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { ISessionRepository } from '@cthub-bsaas/server-contracts-auth';

/**
 * @public
 * Prisma-backed implementation of {@link ISessionRepository}.
 */
@Injectable()
export class SessionRepository implements ISessionRepository {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * @inheritdoc
     */
    async create(data: Prisma.SessionUncheckedCreateInput): Promise<Session> {
        return this.prisma.session.create({ data });
    }

    /**
     * @inheritdoc
     */
    async findById(id: string): Promise<Session | null> {
        return this.prisma.session.findUnique({ where: { id } });
    }

    /**
     * @inheritdoc
     */
    async findByUserId(userId: string): Promise<Session[]> {
        return this.prisma.session.findMany({ where: { userId } });
    }

    /**
     * @inheritdoc
     */
    async update(id: string, data: Prisma.SessionUpdateInput): Promise<Session> {
        return this.prisma.session.update({
            where: { id },
            data,
        });
    }

    /**
     * @inheritdoc
     */
  async delete(id: string): Promise<Session> {
        // Ensure dependent refresh tokens are removed to satisfy FK constraints
        await this.prisma.refreshToken.deleteMany({ where: { sessionId: id } });
        return this.prisma.session.delete({ where: { id } });
  }
}

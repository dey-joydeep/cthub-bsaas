import { Injectable } from '@nestjs/common';
import { Prisma, RefreshToken } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { IRefreshTokenRepository } from '@cthub-bsaas/server-contracts-auth';

/**
 * @public
 * Prisma-backed implementation of {@link IRefreshTokenRepository}.
 */
@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * @inheritdoc
     */
    async create(data: Prisma.RefreshTokenUncheckedCreateInput): Promise<RefreshToken> {
        return this.prisma.refreshToken.create({ data });
    }

    /**
     * @inheritdoc
     */
    async findByJti(jti: string): Promise<RefreshToken | null> {
        return this.prisma.refreshToken.findUnique({ where: { jti } });
    }

    /**
     * @inheritdoc
     */
    async revoke(jti: string): Promise<RefreshToken> {
        return this.prisma.refreshToken.update({
            where: { jti },
            data: { revokedAt: new Date() },
        });
    }
}

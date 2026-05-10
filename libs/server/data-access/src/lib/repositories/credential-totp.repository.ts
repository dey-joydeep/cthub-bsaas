import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ICredentialTotpRepository } from '@cthub-bsaas/server-contracts-auth';
import { CredentialTOTP } from '@prisma/client';

/**
 * @public
 * Prisma-backed implementation of {@link ICredentialTotpRepository}.
 */
@Injectable()
export class CredentialTotpRepository implements ICredentialTotpRepository {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * @inheritdoc
     */
    async findByUserId(userId: string): Promise<CredentialTOTP | null> {
        return this.prisma.credentialTOTP.findUnique({ where: { userId } });
    }

    /**
     * @inheritdoc
     */
    async create(data: { userId: string; secretEncrypted: Buffer }): Promise<CredentialTOTP> {
        return this.prisma.credentialTOTP.create({
            data: {
                userId: data.userId,
                secretEncrypted: data.secretEncrypted,
            },
        });
    }

    /**
     * @inheritdoc
     */
    async update(userId: string, data: { secretEncrypted?: Buffer; verified?: boolean }): Promise<CredentialTOTP> {
        return this.prisma.credentialTOTP.update({ where: { userId }, data });
    }
}

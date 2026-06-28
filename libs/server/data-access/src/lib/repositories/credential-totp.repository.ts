import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { ICredentialTotpRepository } from '@cthub-bsaas/server-contracts-auth';
import type { CredentialTOTP } from '@prisma/client';

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
    findByUserId(userId: string): Promise<CredentialTOTP | null> {
        return this.prisma.credentialTOTP.findUnique({ where: { userId } });
    }

    /**
     * @inheritdoc
     */
    create(data: { userId: string; secretEncrypted: Buffer }): Promise<CredentialTOTP> {
        return this.prisma.credentialTOTP.create({
            data: {
                userId: data.userId,
                secretEncrypted: new Uint8Array(data.secretEncrypted),
            },
        });
    }

    /**
     * @inheritdoc
     */
    update(userId: string, data: { secretEncrypted?: Buffer; verified?: boolean }): Promise<CredentialTOTP> {
        const updateData: any = { ...data };
        if (data.secretEncrypted) {
            updateData.secretEncrypted = new Uint8Array(data.secretEncrypted);
        }
        return this.prisma.credentialTOTP.update({ where: { userId }, data: updateData });
    }
}

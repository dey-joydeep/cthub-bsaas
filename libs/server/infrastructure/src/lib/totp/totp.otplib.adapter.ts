import { EncryptionService } from '@cthub-bsaas/server-core';
import {
    CREDENTIAL_TOTP_REPOSITORY,
    ICredentialTotpRepository,
    IUserRepository,
    USER_REPOSITORY,
} from '@cthub-bsaas/server-contracts-auth';
import { TotpPort } from '@cthub-bsaas/server-contracts-auth';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

/**
 * @public
 * Otplib-backed implementation of the TotpPort using QRCode for enrollment.
 */
@Injectable()
export class TotpOtplibAdapter implements TotpPort {
    constructor(
        /** Repository for reading user profile by id. */
        @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
        /** Repository for persisting TOTP credential secret and status. */
        @Inject(CREDENTIAL_TOTP_REPOSITORY)
        private readonly credentialTotpRepository: ICredentialTotpRepository,
        /** Symmetric encryption service for at-rest secret protection. */
        private readonly encryptionService: EncryptionService,
    ) {}

    /**
     * Generate a new TOTP secret for a user and return a QR code data URL.
     *
     * @param {string} userId - Id of the user enrolling in TOTP.
     * @returns {Promise<{ qrCodeDataUrl: string; secret: string }>} Enrollment payload with QR code and raw secret.
     */
    async generateSecret(userId: string): Promise<{ qrCodeDataUrl: string; secret: string }> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const secret = authenticator.generateSecret();
        const otpauthUrl = authenticator.keyuri(user.email, 'CthubBsaas', secret);
        const secretEncrypted = Buffer.from(this.encryptionService.encrypt(secret));

        const existingCredential = await this.credentialTotpRepository.findByUserId(userId);
        if (existingCredential) {
            await this.credentialTotpRepository.update(userId, { secretEncrypted, verified: false });
        } else {
            await this.credentialTotpRepository.create({ userId, secretEncrypted });
        }

        const qrCodeDataUrl = await toDataURL(otpauthUrl);
        return { qrCodeDataUrl, secret };
    }

    /**
     * Verify a TOTP code against the stored user secret and mark verified.
     *
     * @param {string} userId - Id of the verifying user.
     * @param {string} token - 6-digit TOTP code.
     * @returns {Promise<boolean>} True when valid, otherwise false.
     */
    async verifyToken(userId: string, token: string): Promise<boolean> {
        const credential = await this.credentialTotpRepository.findByUserId(userId);
        if (!credential) {
            return false;
        }

        const secret = this.encryptionService.decrypt(credential.secretEncrypted.toString());
        const isValid = authenticator.verify({ token, secret });

        if (isValid && !credential.verified) {
            await this.credentialTotpRepository.update(userId, { verified: true });
        }

        return isValid;
    }
}

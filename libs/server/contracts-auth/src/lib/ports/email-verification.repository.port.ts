export const EMAIL_VERIFICATION_REPOSITORY = Symbol('EMAIL_VERIFICATION_REPOSITORY');

export interface EmailVerificationRecord {
  id: string;
  email: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  usedAt: Date | null;
  createdAt: Date;
}

export interface IEmailVerificationRepository {
  upsertForEmail(email: string, codeHash: string, expiresAt: Date): Promise<EmailVerificationRecord>;
  findActiveByEmail(email: string): Promise<EmailVerificationRecord | null>;
  markUsed(id: string): Promise<void>;
  incrementAttempts(id: string): Promise<void>;
}


import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  private readonly ivLength = 16;
  private readonly authTagLength = 16;

  constructor(private readonly configService: ConfigService) {
    const defaultTestKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const encryptionKey =
      this.configService.get<string>('ENCRYPTION_KEY') ||
      this.configService.get<string>('ENCRYPTION_TEST_KEY') ||
      (process.env.NODE_ENV === 'test' ? defaultTestKey : undefined);
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY is not set in environment variables');
    }
    this.key = Buffer.from(encryptionKey, 'hex');
    if (this.key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('hex');
  }

  decrypt(encryptedText: string): string {
    const data = Buffer.from(encryptedText, 'hex');
    const iv = data.slice(0, this.ivLength);
    const authTag = data.slice(this.ivLength, this.ivLength + this.authTagLength);
    const encrypted = data.slice(this.ivLength + this.authTagLength);
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }
}

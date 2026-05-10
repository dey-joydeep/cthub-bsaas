import { Injectable } from '@nestjs/common';

@Injectable()
export class I18nService {
  // Basic implementation that can be expanded later
  translate(key: string, _args?: Record<string, unknown>): string {
    // Simple implementation - just return the key for now
    // In a real implementation, this would use args for interpolation
    return key;
  }
}

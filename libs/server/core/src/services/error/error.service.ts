import { Injectable } from '@nestjs/common';

export type ErrorChannel = 'HTTP' | 'Client' | 'Unknown';

@Injectable()
export class ErrorService {
    handleError(error: unknown, channel: ErrorChannel = 'Unknown'): void {
        // Centralized error handling/logging. Extend as needed.
        // Avoid logging sensitive data in production.
        // For now, keep minimal to satisfy references and allow builds to pass.
         
        console.error(`[${channel}]`, error);
    }
}

import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

// AsyncLocalStorage to carry correlationId through the request lifecycle
const correlationStore = new AsyncLocalStorage<string>();

export function getCorrelationId(): string | undefined {
  return correlationStore.getStore();
}

function generateCorrelationId(): string {
  return `c-${randomUUID()}`;
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const headerKey = 'x-correlation-id';
    const incoming = (req.headers[headerKey] as string | undefined)?.trim();
    const cid = incoming && incoming.length > 0 ? incoming : generateCorrelationId();

    // Expose to downstream via ALS and response header
    correlationStore.run(cid, () => {
      res.setHeader(headerKey, cid);
      (req as unknown as { correlationId?: string }).correlationId = cid;
      next();
    });
  }
}

export const CorrelationId = {
  get: getCorrelationId,
};

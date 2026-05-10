import type { Request, Response, NextFunction } from 'express';
import { CorrelationIdMiddleware, CorrelationId } from './correlation-id.middleware';

describe('CorrelationIdMiddleware', () => {
  const createRes = () => {
    const headers: Record<string, string> = {};
    const res = {
      setHeader: (k: string, v: string) => {
        headers[k.toLowerCase()] = v;
      },
      get headers() {
        return headers;
      },
    } as unknown as Response & { headers: Record<string, string> };
    return res;
  };

  const createReq = (headerValue?: string) => {
    const headers: Record<string, string> = {};
    if (headerValue) headers['x-correlation-id'] = headerValue;
    const req = {
      headers,
    } as unknown as Request & { correlationId?: string; headers: Record<string, string> };
    return req;
  };

  it('generates and attaches correlation id when missing', (done) => {
    const mw = new CorrelationIdMiddleware();
    const req = createReq();
    const res = createRes();

    const next: NextFunction = () => {
      const headerCid = res.headers['x-correlation-id'];
      expect(headerCid).toBeDefined();
      expect(typeof headerCid).toBe('string');
      // Accessible via ALS getter within request context
      expect(CorrelationId.get()).toBe(headerCid);
      // Exposed on req object for convenience
      expect(req.correlationId).toBe(headerCid);
      done();
    };

    mw.use(req as unknown as Request, res as unknown as Response, next);
  });

  it('preserves incoming x-correlation-id if provided', (done) => {
    const incoming = 'cid-incoming-123';
    const mw = new CorrelationIdMiddleware();
    const req = createReq(incoming);
    const res = createRes();

    const next: NextFunction = () => {
      const headerCid = res.headers['x-correlation-id'];
      expect(headerCid).toBe(incoming);
      expect(CorrelationId.get()).toBe(incoming);
      expect(req.correlationId).toBe(incoming);
      done();
    };

    mw.use(req as unknown as Request, res as unknown as Response, next);
  });
});
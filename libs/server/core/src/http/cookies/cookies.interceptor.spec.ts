import { Test } from '@nestjs/testing';
import { CookiesInterceptor } from './cookies.interceptor';
import { CookieRegistry } from './cookie-commands';
import { HttpAdapterHost } from '@nestjs/core';
import { of } from 'rxjs';

describe('CookiesInterceptor', () => {
  it('should do nothing if registry is empty', (done) => {
    const registry = new CookieRegistry();
    const interceptor = new CookiesInterceptor(registry, {} as HttpAdapterHost);
    const handler = { handle: () => of('ok') };
    const mockResponse = { append: jest.fn() };
    const host = { switchToHttp: () => ({ getResponse: () => mockResponse }) };

    interceptor.intercept(host as any, handler).subscribe(() => {
      expect(mockResponse.append).not.toHaveBeenCalled();
      done();
    });
  });

  it('should call res.append for Express-like response', (done) => {
    const registry = new CookieRegistry();
    const interceptor = new CookiesInterceptor(registry, {} as HttpAdapterHost);
    registry.set('test', 'value');
    const handler = { handle: () => of('ok') };
    const mockResponse = { append: jest.fn() };
    const host = { switchToHttp: () => ({ getResponse: () => mockResponse }) };

    interceptor.intercept(host as any, handler).subscribe(() => {
      expect(mockResponse.append).toHaveBeenCalledWith('Set-Cookie', 'test=value');
      done();
    });
  });

  it('should call res.header for Fastify-like response', (done) => {
    const registry = new CookieRegistry();
    const interceptor = new CookiesInterceptor(registry, {} as HttpAdapterHost);
    registry.set('test1', 'value1');
    registry.set('test2', 'value2');
    const handler = { handle: () => of('ok') };
    const mockResponse = { header: jest.fn() };
    const host = { switchToHttp: () => ({ getResponse: () => mockResponse }) };

    interceptor.intercept(host as any, handler).subscribe(() => {
      expect(mockResponse.header).toHaveBeenCalledWith('Set-Cookie', ['test1=value1', 'test2=value2']);
      done();
    });
  });

  it('should use httpAdapter as a fallback', (done) => {
    const registry = new CookieRegistry();
    const mockAdapter = { setHeader: jest.fn() };
    const interceptor = new CookiesInterceptor(registry, { httpAdapter: mockAdapter } as any);
    registry.set('test', 'value');
    const handler = { handle: () => of('ok') };
    const mockResponse = {}; // No append or header methods
    const host = { switchToHttp: () => ({ getResponse: () => mockResponse }) };

    interceptor.intercept(host as any, handler).subscribe(() => {
      expect(mockAdapter.setHeader).toHaveBeenCalledWith(mockResponse, 'Set-Cookie', 'test=value');
      done();
    });
  });
});

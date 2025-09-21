import { Test } from '@nestjs/testing';
import { CookiesInterceptor } from './cookies.interceptor';
import { CookieRegistry } from './cookie-commands';
import { HttpAdapterHost, ExecutionContext, CallHandler } from '@nestjs/core'; // Import ExecutionContext and CallHandler
import { of, Observable } from 'rxjs'; // Import Observable

interface MockResponse {
  append?: (name: string, value: string) => void;
  header?: (name: string, value: string[]) => void;
}

interface MockExecutionContext extends ExecutionContext {
  switchToHttp: () => {
    getResponse: () => MockResponse;
  };
}

interface MockCallHandler extends CallHandler {
  handle: () => Observable<any>; // This 'any' is acceptable as it's a generic observable
}

describe('CookiesInterceptor', () => {
  it('should do nothing if registry is empty', (done) => {
    const registry = new CookieRegistry();
    const interceptor = new CookiesInterceptor(registry, {} as HttpAdapterHost);
    const handler: MockCallHandler = { handle: () => of('ok') };
    const mockResponse: MockResponse = { append: jest.fn() };
    const host: MockExecutionContext = { switchToHttp: () => ({ getResponse: () => mockResponse }) } as MockExecutionContext;

    interceptor.intercept(host, handler).subscribe(() => {
      expect(mockResponse.append).not.toHaveBeenCalled();
      done();
    });
  });

  it('should call res.append for Express-like response', (done) => {
    const registry = new CookieRegistry();
    const interceptor = new CookiesInterceptor(registry, {} as HttpAdapterHost);
    registry.set('test', 'value');
    const handler: MockCallHandler = { handle: () => of('ok') };
    const mockResponse: MockResponse = { append: jest.fn() };
    const host: MockExecutionContext = { switchToHttp: () => ({ getResponse: () => mockResponse }) } as MockExecutionContext;

    interceptor.intercept(host, handler).subscribe(() => {
      expect(mockResponse.append).toHaveBeenCalledWith('Set-Cookie', 'test=value');
      done();
    });
  });

  it('should call res.header for Fastify-like response', (done) => {
    const registry = new CookieRegistry();
    const interceptor = new CookiesInterceptor(registry, {} as HttpAdapterHost);
    registry.set('test1', 'value1');
    registry.set('test2', 'value2');
    const handler: MockCallHandler = { handle: () => of('ok') };
    const mockResponse: MockResponse = { header: jest.fn() };
    const host: MockExecutionContext = { switchToHttp: () => ({ getResponse: () => mockResponse }) } as MockExecutionContext;

    interceptor.intercept(host, handler).subscribe(() => {
      expect(mockResponse.header).toHaveBeenCalledWith('Set-Cookie', ['test1=value1', 'test2=value2']);
      done();
    });
  });

  it('should use httpAdapter as a fallback', (done) => {
    const registry = new CookieRegistry();
    const mockAdapter = { setHeader: jest.fn() };
    const interceptor = new CookiesInterceptor(registry, { httpAdapter: mockAdapter } as HttpAdapterHost); // Keep as HttpAdapterHost for now
    registry.set('test', 'value');
    const handler: MockCallHandler = { handle: () => of('ok') };
    const mockResponse: MockResponse = {}; // No append or header methods
    const host: MockExecutionContext = { switchToHttp: () => ({ getResponse: () => mockResponse }) } as MockExecutionContext;

    interceptor.intercept(host, handler).subscribe(() => {
      expect(mockAdapter.setHeader).toHaveBeenCalledWith(mockResponse, 'Set-Cookie', 'test=value');
      done();
    });
  });
});

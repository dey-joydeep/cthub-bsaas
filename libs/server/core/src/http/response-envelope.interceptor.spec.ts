import { Test } from '@nestjs/testing';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor';
import { of } from 'rxjs';
import { ExecutionContext } from '@nestjs/common';

describe('ResponseEnvelopeInterceptor', () => {
  let interceptor: ResponseEnvelopeInterceptor<any>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ResponseEnvelopeInterceptor],
    }).compile();

    interceptor = module.get<ResponseEnvelopeInterceptor<any>>(ResponseEnvelopeInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should wrap a plain object response', (done) => {
    const handler = { handle: () => of({ test: 'data' }) };
    interceptor.intercept({} as ExecutionContext, handler).subscribe((result) => {
      expect(result).toEqual({ success: true, data: { test: 'data' } });
      done();
    });
  });

  it('should not wrap a @Redirect response object', (done) => {
    const redirectObject = { url: '/test', statusCode: 302 };
    const handler = { handle: () => of(redirectObject) };
    interceptor.intercept({} as ExecutionContext, handler).subscribe((result) => {
      expect(result).toEqual(redirectObject);
      done();
    });
  });

  it('should wrap a null response', (done) => {
    const handler = { handle: () => of(null) };
    interceptor.intercept({} as ExecutionContext, handler).subscribe((result) => {
      expect(result).toEqual({ success: true, data: null });
      done();
    });
  });

  it('should wrap an undefined response', (done) => {
    const handler = { handle: () => of(undefined) };
    interceptor.intercept({} as ExecutionContext, handler).subscribe((result) => {
      expect(result).toEqual({ success: true, data: undefined });
      done();
    });
  });

  it('should wrap an empty object response', (done) => {
    const handler = { handle: () => of({}) };
    interceptor.intercept({} as ExecutionContext, handler).subscribe((result) => {
      expect(result).toEqual({ success: true, data: {} });
      done();
    });
  });

  it('should wrap an array response', (done) => {
    const arrayData = [{ id: 1 }, { id: 2 }];
    const handler = { handle: () => of(arrayData) };
    interceptor.intercept({} as ExecutionContext, handler).subscribe((result) => {
      expect(result).toEqual({ success: true, data: arrayData });
      done();
    });
  });
});
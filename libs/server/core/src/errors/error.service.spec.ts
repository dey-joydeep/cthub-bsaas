import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppError } from './app.error';
import { LoggerService } from '../logger/logger.service';
import { ErrorService, NormalizedError } from './error.service';
import { mock, MockProxy } from 'jest-mock-extended';

const createLoggerMock = (): MockProxy<LoggerService> => mock<LoggerService>();

describe('ErrorService', () => {
  let service: ErrorService;
  let logger: MockProxy<LoggerService>;
  let module: TestingModule;

  beforeEach(async () => {
    logger = createLoggerMock();

    module = await Test.createTestingModule({
      providers: [
        ErrorService,
        {
          provide: LoggerService,
          useValue: logger,
        },
      ],
    }).compile();

    service = module.get(ErrorService);
  });

  it('can be constructed directly', () => {
    const directService = new ErrorService(logger);
    expect(directService).toBeInstanceOf(ErrorService);
  });

  it('throws if constructed without a logger', () => {
    expect(() => new ErrorService(undefined as unknown as LoggerService)).toThrow('LoggerService required');
  });

  afterEach(async () => {
    await module.close();
    jest.clearAllMocks();
  });

  it('normalizes AppError below 500 and logs a warning', () => {
    const appError = new AppError('Forbidden', 'AUTH_FORBIDDEN', HttpStatus.FORBIDDEN, { userId: '123' });

    const normalized = service.handle(appError, {
      includeStack: true,
      requestUrl: '/auth/login',
    });

    expect(normalized).toMatchObject<Partial<NormalizedError>>({
      status: HttpStatus.FORBIDDEN,
      code: 'AUTH_FORBIDDEN',
      message: 'Forbidden',
      details: { userId: '123' },
      shouldMaskResponse: false,
    });
    expect(normalized.stack).toEqual(expect.any(String));

    expect(logger.warn).toHaveBeenCalledTimes(1);
    const [payload, context] = logger.warn.mock.calls[0];
    expect(payload).toContain('"code":"AUTH_FORBIDDEN"');
    expect(context).toBe('ErrorService');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('normalizes AppError >= 500 and logs an error with stack trace', () => {
    const appError = new AppError('Failure', 'SERVER_FAILURE', HttpStatus.INTERNAL_SERVER_ERROR);

    service.handle(appError);

    expect(logger.error).toHaveBeenCalledTimes(1);
    const [payload, trace, context] = logger.error.mock.calls[0];
    expect(payload).toContain('"code":"SERVER_FAILURE"');
    expect(context).toBe('ErrorService');
    expect(typeof trace === 'string' || trace === undefined).toBeTruthy();
  });

  it('normalizes HttpException payloads', () => {
    const exception = new HttpException(
      { message: ['Invalid data'], code: 'BAD_REQUEST', details: { field: 'email' } },
      HttpStatus.BAD_REQUEST,
    );

    const normalized = service.handle(exception, { context: 'Controller' });

    expect(normalized).toMatchObject<Partial<NormalizedError>>({
      status: HttpStatus.BAD_REQUEST,
      code: 'BAD_REQUEST',
      message: 'Invalid data',
      details: { field: 'email' },
      shouldMaskResponse: false,
    });

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('"code":"BAD_REQUEST"'), 'Controller');
  });

  it('handles HttpException with a string response', () => {
    const exception = new HttpException('Custom error message', HttpStatus.NOT_FOUND);
    const normalized = service.handle(exception);
    expect(normalized.message).toBe('Custom error message');
    expect(normalized.code).toBe('HTTP_EXCEPTION');
  });

  it('falls back to exception message when response payload is null', () => {
    const exception = new HttpException('placeholder', HttpStatus.BAD_REQUEST);
    jest.spyOn(exception, 'getResponse').mockReturnValue(null as unknown as Record<string, unknown>);

    const normalized = service.handle(exception);
    expect(normalized.message).toBe(exception.message);
  });

  it('handles HttpException with a string message in object response', () => {
    const exception = new HttpException({ message: 'String message' }, HttpStatus.BAD_REQUEST);
    const normalized = service.handle(exception);
    expect(normalized.message).toBe('String message');
  });

  it('handles HttpException with an array message in object response', () => {
    const exception = new HttpException({ message: ['First error', 'Second error'] }, HttpStatus.BAD_REQUEST);
    const normalized = service.handle(exception);
    expect(normalized.message).toBe('First error, Second error');
  });

  it('includes stack trace for HttpException when includeStack is true', () => {
    const exception = new HttpException('boom', HttpStatus.INTERNAL_SERVER_ERROR);
    const normalized = service.handle(exception, { includeStack: true });
    expect(normalized.stack).toBe(exception.stack);
  });

  it('handles HttpException with non-object details', () => {
    const exception = new HttpException({ details: 'not an object' }, HttpStatus.BAD_REQUEST);
    const normalized = service.handle(exception);
    expect(normalized.details).toBeUndefined();
  });

  it('falls back for generic errors', () => {
    const error = new Error('Boom');

    const normalized = service.handle(error);

    expect(normalized).toMatchObject<Partial<NormalizedError>>({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'UNHANDLED_ERROR',
      message: 'Boom',
      shouldMaskResponse: true,
    });

    expect(logger.error).toHaveBeenCalledTimes(1);
    const [payload, trace, context] = logger.error.mock.calls[0];
    expect(payload).toContain('"code":"UNHANDLED_ERROR"');
    expect(context).toBe('ErrorService');
    expect(typeof trace === 'string' || trace === undefined).toBeTruthy();
  });

  it('treats explicit undefined options the same as default', () => {
    const error = new Error('explicit');
    const normalized = service.handle(error, undefined);
    expect(normalized.code).toBe('UNHANDLED_ERROR');
  });


  it('handles generic error with no message', () => {
    const error = new Error();
    const normalized = service.handle(error);
    expect(normalized.message).toBe('Unhandled error');
  });

  it('handles unknown error types gracefully', () => {
    const normalized = service.handle(12345);

    expect(normalized).toEqual<NormalizedError>({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      shouldMaskResponse: true,
    });

    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('logs non-Error exceptions without a stack trace', () => {
    service.handle('a string error');
    expect(logger.error).toHaveBeenCalledWith(expect.any(String), undefined, 'ErrorService');
  });

  it('does not include stack trace when includeStack is false', () => {
    const error = new Error('test');
    const normalized = service.handle(error, { includeStack: false });
    expect(normalized.stack).toBeUndefined();
  });

  it('handles nullish stack trace', () => {
    const error = new Error('test');
    Object.defineProperty(error, 'stack', { value: undefined, configurable: true, writable: true });

    service.handle(error, { includeStack: true });
    expect(logger.error).toHaveBeenCalledWith(expect.any(String), undefined, 'ErrorService');
  });
});

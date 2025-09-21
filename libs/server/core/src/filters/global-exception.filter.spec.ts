import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';

import { GlobalExceptionFilter } from './global-exception.filter';
import { ErrorService, NormalizedError } from '../errors/error.service';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let errorService: jest.Mocked<ErrorService>;
  let module: TestingModule;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(async () => {
    errorService = {
      handle: jest.fn(),
    } as unknown as jest.Mocked<ErrorService>;

    module = await Test.createTestingModule({
      providers: [
        GlobalExceptionFilter,
        {
          provide: ErrorService,
          useValue: errorService,
        },
      ],
    }).compile();

    filter = module.get(GlobalExceptionFilter);
    process.env.NODE_ENV = 'test';
  });

  afterEach(async () => {
    await module.close();
    process.env.NODE_ENV = originalNodeEnv;
    jest.clearAllMocks();
  });

  it('should delegate to ErrorService and respond with normalized payload', () => {
    const normalized: NormalizedError = {
      status: HttpStatus.BAD_REQUEST,
      code: 'BAD_REQUEST',
      message: 'Invalid input',
      shouldMaskResponse: false,
    };
    errorService.handle.mockReturnValue(normalized);

    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ url: '/test' }),
      }),
    };

    filter.catch(new Error('oops'), host as any);

    expect(errorService.handle).toHaveBeenCalledWith(expect.any(Error), {
      context: 'GlobalExceptionFilter',
      requestUrl: '/test',
      includeStack: true,
    });

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Invalid input',
      code: 'BAD_REQUEST',
      timestamp: expect.any(String),
      path: '/test',
    });
  });

  it('should mask message and omit details/stack in production for server errors', () => {
    const normalized: NormalizedError = {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'SERVER_ERROR',
      message: 'Sensitive info',
      details: { foo: 'bar' },
      stack: 'stacktrace',
      shouldMaskResponse: true,
    };
    errorService.handle.mockReturnValue(normalized);
    process.env.NODE_ENV = 'production';

    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ url: '/secure' }),
      }),
    };

    filter.catch(new Error('oops'), host as any);

    expect(errorService.handle).toHaveBeenCalledWith(expect.any(Error), {
      context: 'GlobalExceptionFilter',
      requestUrl: '/secure',
      includeStack: false,
    });

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An internal server error occurred',
      code: 'SERVER_ERROR',
      timestamp: expect.any(String),
      path: '/secure',
    });
  });

  it('should include details and stack when not in production', () => {
    const normalized: NormalizedError = {
      status: HttpStatus.BAD_REQUEST,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: { field: 'email' },
      stack: 'a-stack-trace',
      shouldMaskResponse: false,
    };
    errorService.handle.mockReturnValue(normalized);

    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ url: '/test' }),
      }),
    };

    filter.catch(new Error('validation'), host as any);

    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      timestamp: expect.any(String),
      path: '/test',
      details: { field: 'email' },
      stack: 'a-stack-trace',
    });
  });

  it('should not include details if shouldMask is true', () => {
    const normalized: NormalizedError = {
      status: HttpStatus.BAD_REQUEST,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: { field: 'email' },
      shouldMaskResponse: true,
    };
    errorService.handle.mockReturnValue(normalized);

    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ url: '/test' }),
      }),
    };

    filter.catch(new Error('validation'), host as any);

    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      timestamp: expect.any(String),
      path: '/test',
    });
  });
});
import { HttpStatus, ArgumentsHost } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response, Request } from 'express';
import { mock, MockProxy } from 'jest-mock-extended';
import type { ContextType, HttpArgumentsHost } from '@nestjs/common/interfaces';

import { GlobalExceptionFilter } from './global-exception.filter';
import { ErrorService, NormalizedError } from '../errors/error.service';


interface ErrorResponseBody {
  statusCode: number;
  message: string;
  code: string;
  timestamp: string;
  path: string;
  details?: Record<string, unknown>;
  stack?: string;
}

const createResponse = (): Response<ErrorResponseBody> => {
  const response = mock<Response<ErrorResponseBody>>();
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
};

const createRequest = (url: string, method: string = 'GET'): Request => {
  const request = mock<Request>();
  request.url = url;
  request.method = method;
  return request;
};

const createArgumentsHost = (request: Request, response: Response): ArgumentsHost => {
  const httpHost = mock<HttpArgumentsHost>();
  httpHost.getResponse.mockReturnValue(response as never);
  httpHost.getRequest.mockReturnValue(request as never);
  httpHost.getNext.mockReturnValue(undefined as never);

  const host = mock<ArgumentsHost>();
  host.switchToHttp.mockReturnValue(httpHost);
  host.getArgs.mockReturnValue([] as never);
  host.getArgByIndex.mockReturnValue(undefined as never);
  host.switchToRpc.mockImplementation(() => {
    throw new Error('RPC context not supported in this test harness.');
  });
  host.switchToWs.mockImplementation(() => {
    throw new Error('WebSocket context not supported in this test harness.');
  });
  host.getType.mockReturnValue('http' as ContextType);

  return host;
};

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let errorService: MockProxy<ErrorService>;
  let module: TestingModule;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(async () => {
    errorService = mock<ErrorService>();

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

    const response = createResponse();
    const statusMock = response.status as jest.MockedFunction<Response<ErrorResponseBody>['status']>;
    const jsonMock = response.json as jest.MockedFunction<Response<ErrorResponseBody>['json']>;
    const request = createRequest('/test');
    const host = createArgumentsHost(request, response);

    const exception = new Error('oops');
    filter.catch(exception, host);

    const [caughtException, metadata] = errorService.handle.mock.calls[0] ?? [];
    expect(caughtException).toBe(exception);
    expect(metadata).toEqual({
      context: 'GlobalExceptionFilter',
      requestUrl: '/test',
      includeStack: true,
    });

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const [firstPayload] = jsonMock.mock.calls[0] ?? [];
    expect(firstPayload).toBeDefined();
    const payload = firstPayload!;
    expect(payload).toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Invalid input',
      code: 'BAD_REQUEST',
      path: '/test',
    });
    expect(typeof payload.timestamp).toBe('string');
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

    const response = createResponse();
    const statusMock = response.status as jest.MockedFunction<Response<ErrorResponseBody>['status']>;
    const jsonMock = response.json as jest.MockedFunction<Response<ErrorResponseBody>['json']>;
    const request = createRequest('/secure');
    const host = createArgumentsHost(request, response);

    const exception = new Error('oops');
    filter.catch(exception, host);

    const [caughtException, metadata] = errorService.handle.mock.calls[0] ?? [];
    expect(caughtException).toBe(exception);
    expect(metadata).toEqual({
      context: 'GlobalExceptionFilter',
      requestUrl: '/secure',
      includeStack: false,
    });

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const [firstPayload] = jsonMock.mock.calls[0] ?? [];
    expect(firstPayload).toBeDefined();
    const payload = firstPayload!;
    expect(payload).toMatchObject({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An internal server error occurred',
      code: 'SERVER_ERROR',
      path: '/secure',
    });
    expect(typeof payload.timestamp).toBe('string');
    expect(payload.details).toBeUndefined();
    expect(payload.stack).toBeUndefined();
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

    const response = createResponse();
    const jsonMock = response.json as jest.MockedFunction<Response<ErrorResponseBody>['json']>;
    const request = createRequest('/test');
    const host = createArgumentsHost(request, response);

    filter.catch(new Error('validation'), host);

    const [firstPayload] = jsonMock.mock.calls[0] ?? [];
    expect(firstPayload).toBeDefined();
    const payload = firstPayload!;
    expect(payload).toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      path: '/test',
      details: { field: 'email' },
      stack: 'a-stack-trace',
    });
    expect(typeof payload.timestamp).toBe('string');
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

    const response = createResponse();
    const jsonMock = response.json as jest.MockedFunction<Response<ErrorResponseBody>['json']>;
    const request = createRequest('/test');
    const host = createArgumentsHost(request, response);

    filter.catch(new Error('validation'), host);

    const [firstPayload] = jsonMock.mock.calls[0] ?? [];
    expect(firstPayload).toBeDefined();
    const payload = firstPayload!;
    expect(payload).toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      path: '/test',
    });
    expect(typeof payload.timestamp).toBe('string');
    expect(payload.details).toBeUndefined();
  });
});
import { HttpStatus, ArgumentsHost } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response, Request } from 'express';
import { mock, MockProxy } from 'jest-mock-extended';
import type { ContextType, HttpArgumentsHost } from '@nestjs/common/interfaces';

import { GlobalExceptionFilter } from './global-exception.filter';
import { ErrorService, NormalizedError } from '../errors/error.service';

interface ErrorResponseBody {
  success: false;
  message: string;
  code: string;
  details?: Record<string, unknown>;
  meta?: { correlationId: string };
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

  it('should delegate to ErrorService and respond with canonical envelope', () => {
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
    const payload = firstPayload! as ErrorResponseBody;
    expect(payload).toMatchObject({
      success: false,
      message: 'Invalid input',
      code: 'BAD_REQUEST',
    });
    expect(payload.meta).toBeUndefined();
  });

  it('should mask message and omit details in production for server errors', () => {
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
    const payload = firstPayload! as ErrorResponseBody;
    expect(payload).toMatchObject({
      success: false,
      message: 'An internal server error occurred',
      code: 'SERVER_ERROR',
    });
    expect(payload.details).toBeUndefined();
  });

  it('should include details when not in production', () => {
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
    const payload = firstPayload! as ErrorResponseBody;
    expect(payload).toMatchObject({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: { field: 'email' },
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

    const response = createResponse();
    const jsonMock = response.json as jest.MockedFunction<Response<ErrorResponseBody>['json']>;
    const request = createRequest('/test');
    const host = createArgumentsHost(request, response);

    filter.catch(new Error('validation'), host);

    const [firstPayload] = jsonMock.mock.calls[0] ?? [];
    expect(firstPayload).toBeDefined();
    const payload = firstPayload! as ErrorResponseBody;
    expect(payload).toMatchObject({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
    });
    expect(payload.details).toBeUndefined();
  });
});

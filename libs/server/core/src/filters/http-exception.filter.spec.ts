import { Test } from '@nestjs/testing';
import { HttpExceptionFilter } from './http-exception.filter';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import type { ContextType, HttpArgumentsHost } from '@nestjs/common/interfaces';
import { LoggerService } from '../logger/logger.service';
import { Request, Response } from 'express';
import { mock, MockProxy } from 'jest-mock-extended';

interface HttpErrorResponseBody {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
}

const createResponse = (): Response<HttpErrorResponseBody> => {
  const response = mock<Response<HttpErrorResponseBody>>();
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

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let logger: MockProxy<LoggerService>;

  beforeEach(async () => {
    logger = mock<LoggerService>();

    const module = await Test.createTestingModule({
      providers: [
        HttpExceptionFilter,
        {
          provide: LoggerService,
          useValue: logger,
        },
      ],
    }).compile();
    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException and not log if status < 500', () => {
    const response = createResponse();
    const statusMock = response.status as jest.MockedFunction<Response<HttpErrorResponseBody>['status']>;
    const jsonMock = response.json as jest.MockedFunction<Response<HttpErrorResponseBody>['json']>;
    const request = createRequest('/');
    const host = createArgumentsHost(request, response);

    const exception = new HttpException('Test Exception', HttpStatus.BAD_REQUEST);
    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const [firstPayload] = jsonMock.mock.calls[0] ?? [];
    expect(firstPayload).toBeDefined();
    const payload = firstPayload!;
    expect(payload).toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
      path: '/',
      message: 'Test Exception',
    });
    expect(typeof payload.timestamp).toBe('string');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should handle non-HttpException errors and log them', () => {
    const response = createResponse();
    const statusMock = response.status as jest.MockedFunction<Response<HttpErrorResponseBody>['status']>;
    const jsonMock = response.json as jest.MockedFunction<Response<HttpErrorResponseBody>['json']>;
    const request = createRequest('/');
    const host = createArgumentsHost(request, response);

    const exception = new Error('Generic error');
    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const [firstPayload] = jsonMock.mock.calls[0] ?? [];
    expect(firstPayload).toBeDefined();
    const payload = firstPayload!;
    expect(payload).toMatchObject({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      path: '/',
      message: 'Generic error',
    });
    expect(typeof payload.timestamp).toBe('string');
    expect(logger.error).toHaveBeenCalledWith('HTTP Exception: GET /', exception.stack, 'HttpExceptionFilter');
  });

  it('should handle non-Error exceptions and log them', () => {
    const response = createResponse();
    const statusMock = response.status as jest.MockedFunction<Response<HttpErrorResponseBody>['status']>;
    const jsonMock = response.json as jest.MockedFunction<Response<HttpErrorResponseBody>['json']>;
    const request = createRequest('/');
    const host = createArgumentsHost(request, response);

    const exception = 'a string error';
    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const [firstPayload] = jsonMock.mock.calls[0] ?? [];
    expect(firstPayload).toBeDefined();
    const payload = firstPayload!;
    expect(payload).toMatchObject({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      path: '/',
      message: 'Internal server error',
    });
    expect(typeof payload.timestamp).toBe('string');
    expect(logger.error).toHaveBeenCalledWith('HTTP Exception: GET /', undefined, 'HttpExceptionFilter');
  });

  it('should log server errors with status >= 500', () => {
    const response = createResponse();
    const request = createRequest('/', 'POST');
    const host = createArgumentsHost(request, response);

    const exception = new HttpException('Internal Error', HttpStatus.INTERNAL_SERVER_ERROR);
    filter.catch(exception, host);

    expect(logger.error).toHaveBeenCalledWith('HTTP Exception: POST /', exception.stack, 'HttpExceptionFilter');
  });
});

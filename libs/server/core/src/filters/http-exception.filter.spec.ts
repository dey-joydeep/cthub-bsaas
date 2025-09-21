import { Test } from '@nestjs/testing';
import { HttpExceptionFilter } from './http-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let logger: LoggerService;

  const mockLoggerService = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        HttpExceptionFilter,
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();
    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
    logger = module.get<LoggerService>(LoggerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException and not log if status < 500', () => {
    const response = {
      status: jest.fn(),
      json: jest.fn(),
    };
    response.status.mockReturnValue(response);

    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ url: '/', method: 'GET' }),
      }),
    };

    const exception = new HttpException('Test Exception', HttpStatus.BAD_REQUEST);
    filter.catch(exception, host as any);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String),
      path: '/',
      message: 'Test Exception',
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should handle non-HttpException errors and log them', () => {
    const response = {
      status: jest.fn(),
      json: jest.fn(),
    };
    response.status.mockReturnValue(response);

    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ url: '/', method: 'GET' }),
      }),
    };

    const exception = new Error('Generic error');
    filter.catch(exception, host as any);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: expect.any(String),
      path: '/',
      message: 'Generic error',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'HTTP Exception: GET /',
      exception.stack,
      'HttpExceptionFilter',
    );
  });

  it('should handle non-Error exceptions and log them', () => {
    const response = {
      status: jest.fn(),
      json: jest.fn(),
    };
    response.status.mockReturnValue(response);

    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ url: '/', method: 'GET' }),
      }),
    };

    const exception = 'a string error';
    filter.catch(exception, host as any);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: expect.any(String),
      path: '/',
      message: 'Internal server error',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'HTTP Exception: GET /',
      undefined,
      'HttpExceptionFilter',
    );
  });

  it('should log server errors with status >= 500', () => {
    const response = {
      status: jest.fn(),
      json: jest.fn(),
    };
    response.status.mockReturnValue(response);

    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({ url: '/', method: 'POST' }),
      }),
    };

    const exception = new HttpException('Internal Error', HttpStatus.INTERNAL_SERVER_ERROR);
    filter.catch(exception, host as any);

    expect(logger.error).toHaveBeenCalledWith(
      'HTTP Exception: POST /',
      exception.stack,
      'HttpExceptionFilter',
    );
  });
});

import { Test } from '@nestjs/testing';
import { RetryAfterFilter } from './retry-after.filter';
import { ThrottlerException } from '@nestjs/throttler';
import { HttpStatus } from '@nestjs/common';

describe('RetryAfterFilter', () => {
  let filter: RetryAfterFilter;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RetryAfterFilter],
    }).compile();
    filter = module.get<RetryAfterFilter>(RetryAfterFilter);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle ThrottlerException', () => {
    const response = {
      setHeader: jest.fn(),
      status: jest.fn(),
      json: jest.fn(),
    };
    response.status.mockReturnValue(response);

    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    };

    const exception = new ThrottlerException();
interface MockArgumentsHost extends ArgumentsHost {
  switchToHttp: () => {
    getResponse: () => Response;
  };
}

    filter.catch(exception, host as MockArgumentsHost);

    expect(response.setHeader).toHaveBeenCalledWith('Retry-After', '60');
    expect(response.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    expect(response.json).toHaveBeenCalledWith({ code: 'error.rate_limited' });
  });
});

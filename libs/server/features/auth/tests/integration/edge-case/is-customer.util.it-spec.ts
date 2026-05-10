import type { JwtService } from '@nestjs/jwt';
import { isCustomerFromAccessToken } from '../../../src/lib/utils/is-customer.util';

describe('isCustomerFromAccessToken util (IT coverage)', () => {
  it('returns false for undefined token and non-customer roles', () => {
    const jwt = { decode: jest.fn(() => ({ roles: ['ADMIN'] })) } as unknown as JwtService;
    expect(isCustomerFromAccessToken(jwt, undefined)).toBe(false);
    expect(isCustomerFromAccessToken(jwt, 't')).toBe(false);
  });

  it('returns true when roles include CUSTOMER', () => {
    const jwt = { decode: jest.fn(() => ({ roles: ['CUSTOMER'] })) } as unknown as JwtService;
    expect(isCustomerFromAccessToken(jwt, 't')).toBe(true);
  });

  it('handles null decode result gracefully (false)', () => {
    const jwt = { decode: jest.fn(() => null) } as unknown as JwtService;
    expect(isCustomerFromAccessToken(jwt, 't')).toBe(false);
  });

  it('returns false when payload has no roles array', () => {
    const jwtNoRoles = { decode: jest.fn(() => ({})) } as unknown as JwtService;
    expect(isCustomerFromAccessToken(jwtNoRoles, 't')).toBe(false);

    const jwtBadRoles = { decode: jest.fn(() => ({ roles: 'ADMIN' })) } as unknown as JwtService;
    expect(isCustomerFromAccessToken(jwtBadRoles, 't')).toBe(false);
  });
});

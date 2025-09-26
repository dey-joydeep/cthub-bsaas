import 'reflect-metadata';
import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
import { OptionalUser } from './optional-user.decorator';

type ParamFactory = (data: unknown, ctx: ExecutionContext) => unknown;

type DecoratorMetadata = { factory: ParamFactory };
const hasFactory = (value: unknown): value is DecoratorMetadata =>
  typeof value === 'object' && value !== null && typeof (value as { factory?: unknown }).factory === 'function';

function getFactory(): ParamFactory {
  class TestController {
     
    handler(@OptionalUser() _value: unknown) {}
  }

  const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'handler') as
    | Record<string, unknown>
    | undefined;
  if (!metadata) {
    throw new Error('OptionalUser metadata not found');
  }

  const entry = metadata[Object.keys(metadata)[0]];
  if (!hasFactory(entry)) {
    throw new Error('Decorator factory not available on metadata entry');
  }

  return entry.factory;
}

describe('OptionalUser decorator', () => {
  let factory: ParamFactory;

  beforeAll(async () => {
    await Test.createTestingModule({}).compile();
    factory = getFactory();
  });

  it('returns the user when present on the request', () => {
    const user = { id: 'u-1', email: 'test@example.com' } as AuthenticatedUser;
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;

    expect(factory(undefined, ctx)).toEqual(user);
  });

  it('returns undefined when user is missing', () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    expect(factory(undefined, ctx)).toBeUndefined();
  });

  it('returns undefined when request is not an object', () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => null,
      }),
    } as unknown as ExecutionContext;

    expect(factory(undefined, ctx)).toBeUndefined();
  });
});

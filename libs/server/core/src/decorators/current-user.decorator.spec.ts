import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator';

/**
 * Get the runtime factory function Nest stores for a parameter decorator.
 * We type the argument precisely instead of using `Function`.
 */
function getParamDecoratorFactory(decorator: () => ParameterDecorator): (data: unknown, ctx: ExecutionContext) => unknown {
  class TestHost {
    // this call stamps metadata on the method parameter
    test(@decorator() _value: unknown) {}
  }
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestHost, 'test') as unknown;
  const typedArgs = args as Record<string, { factory: (data: unknown, ctx: ExecutionContext) => unknown }>;
  const firstKey = Object.keys(typedArgs)[0];
  return typedArgs[firstKey].factory as (data: unknown, ctx: ExecutionContext) => unknown;
}

describe('CurrentUser Decorator', () => {
  it('should return the user from the request', () => {
    const user = { id: '1', email: 'test@example.com' };
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;

    const factory = getParamDecoratorFactory(CurrentUser);
    const result = factory(null, mockCtx);

    expect(result).toEqual(user);
  });

  it('should throw UnauthorizedException if user is not on the request', () => {
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({}), // no `user` on request
      }),
    } as unknown as ExecutionContext;

    const factory = getParamDecoratorFactory(CurrentUser);
    expect(() => factory(null, mockCtx)).toThrow(UnauthorizedException);
  });
});

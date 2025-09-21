import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator';

// Helper function to get the factory method for the decorator
function getParamDecoratorFactory(decorator: Function) {
  class Test {
    public test(@decorator() _value: unknown) {}
  }
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
  return args[Object.keys(args)[0]].factory;
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
        getRequest: () => ({}), // No user on request
      }),
    } as unknown as ExecutionContext;

    const factory = getParamDecoratorFactory(CurrentUser);
    
    expect(() => factory(null, mockCtx)).toThrow(UnauthorizedException);
  });
});
import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { User } from './user.decorator';

// Helper function to get the factory method for the decorator
function getParamDecoratorFactory(decorator: Function) {
  class Test {
    public test(@decorator() _value: unknown) {}
  }
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
  return args[Object.keys(args)[0]].factory;
}

describe('User Decorator', () => {
  it('should return the user from the request', () => {
    const user = { id: '1', email: 'test@example.com' };
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;

    const factory = getParamDecoratorFactory(User);
    const result = factory(null, mockCtx);

    expect(result).toEqual(user);
  });

  it('should return undefined if user is not on the request', () => {
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({}), // No user on request
      }),
    } as unknown as ExecutionContext;

    const factory = getParamDecoratorFactory(User);
    const result = factory(null, mockCtx);

    expect(result).toBeUndefined();
  });
});

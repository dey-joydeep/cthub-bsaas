import { Public, IS_PUBLIC_KEY } from './public.decorator';

describe('Public Decorator', () => {
  it('should set the correct metadata', () => {
    class TestClass {
      @Public()
      public testMethod() {}
    }

    const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, TestClass.prototype.testMethod);

    expect(isPublic).toBe(true);
  });
});

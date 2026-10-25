import 'reflect-metadata';

import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { CurrentScope } from './current-scope.decorator';

describe('CurrentScope', () => {
  it('registers a parameter decorator that returns request scope', () => {
    class TestController {
      handler(@CurrentScope() _scope: unknown): void {}
    }

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'handler') as
      Record<string, { factory?: (...args: unknown[]) => unknown }> | undefined;
    const entry = metadata?.[Object.keys(metadata)[0]];

    expect(entry?.factory?.(undefined, { switchToHttp: () => ({ getRequest: () => ({ scope: { tenantId: 't1' } }) }) })).toEqual({
      tenantId: 't1',
    });
  });
});

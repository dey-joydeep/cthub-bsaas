type DecoratorFn = (target: unknown, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => unknown;

const fallbackDecorate = (
  decorators: ReadonlyArray<DecoratorFn>,
  target: unknown,
  propertyKey?: string | symbol,
  descriptor?: PropertyDescriptor | null,
): unknown => {
  const argCount = descriptor !== undefined ? 4 : propertyKey !== undefined ? 3 : 2;

  let working: unknown;
  if (argCount < 3) {
    working = target;
  } else if (descriptor === null && propertyKey !== undefined) {
    working = Object.getOwnPropertyDescriptor(target as object, propertyKey) ?? descriptor;
  } else {
    working = descriptor;
  }

  let result = working;
  for (let index = decorators.length - 1; index >= 0; index -= 1) {
    const decorator = decorators[index];
    if (!decorator) {
      continue;
    }

    if (argCount < 3) {
      result = decorator(result) ?? result;
    } else if (argCount > 3) {
      result = decorator(target, propertyKey, result as PropertyDescriptor) ?? result;
    } else {
      result = decorator(target, propertyKey) ?? result;
    }
  }

  if (argCount > 3 && result) {
    Object.defineProperty(target as object, propertyKey as PropertyKey, result as PropertyDescriptor);
  }

  return result ?? working ?? target;
};

describe('Decorator compatibility', () => {
  const originalReflect = global.Reflect;

  beforeAll(() => {
    const baseReflect = originalReflect ?? ({} as typeof Reflect);
    const decorateImpl =
      typeof baseReflect?.decorate === 'function' ? baseReflect.decorate.bind(baseReflect) : (fallbackDecorate as typeof Reflect.decorate);

    (global as typeof globalThis).Reflect = {
      ...baseReflect,
      decorate: decorateImpl,
    } as typeof Reflect;
  });

  afterAll(() => {
    (global as typeof globalThis).Reflect = originalReflect;
  });

  const modules: Array<[string, () => Promise<unknown>]> = [
    ['JwtAuthGuard', () => import('../auth/guards/jwt-auth.guard')],
    ['RolesGuard', () => import('../auth/guards/roles.guard')],
    ['StrongAuthGuard', () => import('../auth/guards/strong-auth.guard')],
    ['ConfigService', () => import('../config/config.service')],
    ['EncryptionService', () => import('../lib/encryption/encryption.service')],
    ['LoggerService', () => import('../logger/logger.service')],
    ['CookiesInterceptor', () => import('../http/cookies/cookies.interceptor')],
    ['HasPermissionToAssignRoleConstraint', () => import('../validation/validators/has-permission.validator')],
    ['IsNotLastAdminConstraint', () => import('../validation/validators/last-admin.validator')],
  ];

  it.each(modules)('hydrates %s using Reflect.decorate path', async (_label, loader) => {
    jest.resetModules();
    const loaded = await loader();
    expect(loaded).toBeDefined();
  });
});

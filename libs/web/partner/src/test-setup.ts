import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

type JasmineCompatibleSpy = jest.Mock & {
  and: {
    callFake: (impl: (...args: any[]) => any) => JasmineCompatibleSpy;
    callThrough: () => JasmineCompatibleSpy;
    returnValue: (value: any) => JasmineCompatibleSpy;
  };
};

declare global {
  // eslint-disable-next-line no-var
  var jasmine:
    | {
        any: (expectedClass: unknown) => unknown;
        createSpy: (name?: string) => JasmineCompatibleSpy;
        createSpyObj: <T extends readonly string[]>(baseName: string, methodNames: T) => Record<T[number], JasmineCompatibleSpy>;
      }
    | undefined;
  // eslint-disable-next-line no-var
  var spyOn: ((obj: object, methodName: string) => JasmineCompatibleSpy | { and: JasmineCompatibleSpy['and'] }) | undefined;
}

function attachJasmineAnd(spy: jest.Mock): JasmineCompatibleSpy {
  const compatibleSpy = spy as JasmineCompatibleSpy;
  compatibleSpy.and = {
    returnValue(value: unknown) {
      spy.mockReturnValue(value);
      return compatibleSpy;
    },
    callFake(impl: (...args: any[]) => any) {
      spy.mockImplementation(impl);
      return compatibleSpy;
    },
    callThrough() {
      return compatibleSpy;
    },
  };
  return compatibleSpy;
}

setupZoneTestEnv();

expect.extend({
  toBeFalse(received: unknown) {
    return {
      message: () => `expected ${String(received)} to be false`,
      pass: received === false,
    };
  },
  toBeTrue(received: unknown) {
    return {
      message: () => `expected ${String(received)} to be true`,
      pass: received === true,
    };
  },
});

if (!globalThis.jasmine) {
  globalThis.jasmine = {
    any(expectedClass: unknown) {
      return expect.any(expectedClass as never);
    },
    createSpy() {
      return attachJasmineAnd(jest.fn());
    },
    createSpyObj(_baseName, methodNames) {
      return Object.fromEntries(methodNames.map((methodName) => [methodName, attachJasmineAnd(jest.fn())])) as Record<
        (typeof methodNames)[number],
        JasmineCompatibleSpy
      >;
    },
  };
}

globalThis.spyOn = ((obj: Record<string, any>, methodName: string) => {
  if (typeof obj[methodName] === 'function') {
    return attachJasmineAnd(jest.spyOn(obj, methodName));
  }

  const propertySpy = attachJasmineAnd(jest.fn());
  const originalValue = obj[methodName];
  propertySpy.and.callFake = (impl) => {
    obj[methodName] = impl;
    return propertySpy;
  };
  propertySpy.and.callThrough = () => {
    obj[methodName] = originalValue;
    return propertySpy;
  };
  propertySpy.and.returnValue = (value) => {
    obj[methodName] = value;
    return propertySpy;
  };
  return { and: propertySpy.and };
}) as typeof globalThis.spyOn;

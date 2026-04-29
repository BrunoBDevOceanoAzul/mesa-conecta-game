import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { isDeepStrictEqual } from "node:util";

type MockCall = unknown[];
type Matcher = { __matcher: "objectContaining"; value: Record<string, unknown> };

function isMatcher(value: unknown): value is Matcher {
  return (
    typeof value === "object" &&
    value !== null &&
    "__matcher" in value &&
    (value as Matcher).__matcher === "objectContaining"
  );
}

function matchesExpected(actual: unknown, expected: unknown): boolean {
  if (isMatcher(expected)) {
    if (typeof actual !== "object" || actual === null) return false;
    return Object.entries(expected.value).every(([key, value]) =>
      matchesExpected((actual as Record<string, unknown>)[key], value)
    );
  }

  return isDeepStrictEqual(actual, expected);
}

function createMock<TArgs extends unknown[], TResult>(
  implementation?: (...args: TArgs) => TResult
) {
  const calls: MockCall[] = [];
  const mockFn = ((...args: TArgs) => {
    calls.push(args);
    return implementation?.(...args);
  }) as ((...args: TArgs) => TResult) & {
    mock: { calls: MockCall[] };
    mockResolvedValue: (value: Awaited<TResult>) => typeof mockFn;
  };

  mockFn.mock = { calls };
  mockFn.mockResolvedValue = (value) => {
    implementation = (() => Promise.resolve(value) as TResult) as (...args: TArgs) => TResult;
    return mockFn;
  };

  return mockFn;
}

function makeExpect(actual: unknown, negated = false) {
  const check = (passes: boolean, message: string) => {
    if (negated ? passes : !passes) {
      throw new assert.AssertionError({ message });
    }
  };

  return {
    get not() {
      return makeExpect(actual, !negated);
    },
    get rejects() {
      return {
        async toThrow(expected?: string | RegExp | (new (...args: never[]) => Error)) {
          let thrown: unknown;
          try {
            await (actual as Promise<unknown>);
          } catch (error) {
            thrown = error;
          }

          if (!thrown) {
            throw new assert.AssertionError({ message: "Expected promise to reject" });
          }

          if (typeof expected === "string") {
            assert.ok(
              thrown instanceof Error && thrown.message.includes(expected),
              `Expected error message to include ${expected}`
            );
            return;
          }

          if (expected instanceof RegExp) {
            assert.match((thrown as Error).message, expected);
            return;
          }

          if (expected) {
            assert.ok(thrown instanceof expected, "Expected rejection to match error type");
          }
        },
      };
    },
    toBe(expected: unknown) {
      check(Object.is(actual, expected), `Expected ${String(actual)} to be ${String(expected)}`);
    },
    toEqual(expected: unknown) {
      check(matchesExpected(actual, expected), "Expected values to be deeply equal");
    },
    toBeNull() {
      check(actual === null, "Expected value to be null");
    },
    toBeDefined() {
      check(actual !== undefined, "Expected value to be defined");
    },
    toContain(expected: unknown) {
      check(
        typeof actual === "string"
          ? actual.includes(String(expected))
          : Array.isArray(actual) && actual.includes(expected),
        `Expected value to contain ${String(expected)}`
      );
    },
    toHaveLength(expected: number) {
      check((actual as { length?: number })?.length === expected, `Expected length ${expected}`);
    },
    toBeGreaterThan(expected: number) {
      check(Number(actual) > expected, `Expected ${String(actual)} to be greater than ${expected}`);
    },
    toHaveBeenCalled() {
      check(((actual as { mock?: { calls: MockCall[] } }).mock?.calls.length ?? 0) > 0, "Expected mock to have been called");
    },
    toHaveBeenCalledTimes(expected: number) {
      check(((actual as { mock?: { calls: MockCall[] } }).mock?.calls.length ?? 0) === expected, `Expected mock to be called ${expected} times`);
    },
    toHaveBeenCalledWith(...expectedArgs: unknown[]) {
      const calls = (actual as { mock?: { calls: MockCall[] } }).mock?.calls ?? [];
      check(
        calls.some((call) =>
          call.length === expectedArgs.length &&
          call.every((arg, index) => matchesExpected(arg, expectedArgs[index]))
        ),
        "Expected mock to have been called with provided arguments"
      );
    },
  };
}

export { describe, it };
export const beforeAll = before;
export const afterAll = after;
export const vi = { fn: createMock };
export const expect = Object.assign(makeExpect, {
  objectContaining(value: Record<string, unknown>) {
    return { __matcher: "objectContaining", value } satisfies Matcher;
  },
});

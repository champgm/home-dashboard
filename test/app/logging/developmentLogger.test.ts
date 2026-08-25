import {
  DEVELOPMENT_LOG_PREFIX,
  emitDevelopmentEvent,
  formatDevelopmentLog,
  sanitizeDevelopmentMetadata,
} from "../../../src/app/developmentLogger";

const globalRecord = globalThis as unknown as { __DEV__?: unknown };

describe("development logger", () => {
  let originalDev: unknown;

  beforeEach(() => {
    originalDev = globalRecord.__DEV__;
    globalRecord.__DEV__ = true;
  });

  afterEach(() => {
    if (originalDev === undefined) delete globalRecord.__DEV__;
    else globalRecord.__DEV__ = originalDev;
    jest.restoreAllMocks();
  });

  test("emits one prefixed, parseable JSON record", () => {
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined);

    emitDevelopmentEvent("info", "Operation.Started", { operation: "Hue snapshot", elapsedMs: 12 });

    expect(info).toHaveBeenCalledTimes(1);
    const line = info.mock.calls[0][0] as string;
    expect(line.startsWith(DEVELOPMENT_LOG_PREFIX)).toBe(true);
    expect(line.includes("\n")).toBe(false);
    expect(JSON.parse(line.slice(DEVELOPMENT_LOG_PREFIX.length))).toMatchObject({
      level: "info",
      event: "operation.started",
      context: { operation: "Hue snapshot", elapsedMs: 12 },
    });
  });

  test("redacts credentials at every nesting level, including Error messages", () => {
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined);
    const error = Object.assign(new Error("GET /api/SECRET_USERNAME/config username=SECRET_USERNAME"), {
      code: "E_AUTH",
      category: "AuthenticationRejected",
      stack: "do not include this stack",
      raw: { password: "SECRET_PASSWORD" },
    });

    emitDevelopmentEvent("info", "credentials.test", {
      authorization: "SECRET_AUTHORIZATION",
      nested: {
        api_key: "SECRET_API_KEY",
        array: [{ token: "SECRET_TOKEN" }, "path /api/SECRET_PATH/lights"],
      },
      error,
    });

    const line = info.mock.calls[0][0] as string;
    expect(line).not.toContain("SECRET_");
    expect(line).not.toContain("do not include this stack");
    expect(line).toContain("<redacted>");
    const parsed = JSON.parse(line.slice(DEVELOPMENT_LOG_PREFIX.length));
    expect(parsed.context.authorization).toBe("<redacted>");
    expect(parsed.context.nested.api_key).toBe("<redacted>");
    expect(parsed.context.error).toEqual({
      category: "AuthenticationRejected",
      code: "E_AUTH",
      message: "GET /api/<redacted>/config username=<redacted>",
      name: "Error",
    });
  });

  test("bounds strings, depth, arrays, and object keys deterministically", () => {
    const metadata: Record<string, unknown> = {};
    for (let index = 0; index < 35; index += 1) metadata[`key-${index}`] = index;
    const deep = { one: { two: { three: { four: { five: "hidden" } } } } };
    const array = Array.from({ length: 25 }, (_value, index) => index);

    const result = sanitizeDevelopmentMetadata({
      long: "x".repeat(300),
      metadata,
      deep,
      array,
    }) as Record<string, any>;

    expect(result.long).toHaveLength(240);
    expect(result.metadata.__truncated).toBe(true);
    expect(result.array).toHaveLength(21);
    expect(result.array[20]).toBe("<truncated>");
    expect(result.deep.one.two.three.four).toBe("<max-depth>");
  });

  test("handles unsupported, circular, and hostile values without mutation or throwing", () => {
    const circular: Record<string, unknown> = { value: "unchanged" };
    circular.self = circular;
    const input = {
      circular,
      undefinedValue: undefined,
      bigintValue: BigInt(4),
      functionValue: () => "not emitted",
      symbolValue: Symbol("not emitted"),
      nonFinite: Number.POSITIVE_INFINITY,
    };
    const before = input.circular.value;

    expect(() => emitDevelopmentEvent("debug", "unsupported.values", input)).not.toThrow();
    expect(input.circular.value).toBe(before);
    expect(sanitizeDevelopmentMetadata(input)).toMatchObject({
      undefinedValue: "<undefined>",
      bigintValue: "<bigint>",
      functionValue: "<unsupported>",
      symbolValue: "<unsupported>",
      nonFinite: "<non-finite-number>",
      circular: { self: "<circular>" },
    });
  });

  test("does not emit in production mode", () => {
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined);
    globalRecord.__DEV__ = false;

    emitDevelopmentEvent("info", "production.disabled", { credential: "SECRET" });

    expect(info).not.toHaveBeenCalled();
  });

  test("formats a deterministic record for runner and unit-test consumers", () => {
    const line = formatDevelopmentLog("warn", "Mixed Event", { token: "SECRET" }, "2026-08-24T00:00:00.000Z");
    expect(line).toBe(`${DEVELOPMENT_LOG_PREFIX}{"timestamp":"2026-08-24T00:00:00.000Z","level":"warn","event":"mixed-event","context":{"token":"<redacted>"}}`);
  });
});

import { strict as assert } from "node:assert";
import { EventEmitter } from "node:events";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import {
  ANDROID_PACKAGE,
  ANDROID_PLATFORM,
  ANDROID_SYSTEM_IMAGE,
  AVD_NAME,
  MODERN_TOOL_DIRECTORY,
  avdIsListed,
  modernToolInstallationMessage,
  resolveAndroidTools,
  resolveSdkRoot,
  toolPaths,
} from "../../scripts/setup-android-debug.mjs";
import {
  LineAccumulator,
  DEFAULT_HOST_METRO_PORT,
  SessionLogWriter,
  adbReverseArguments,
  cleanupChildren,
  findAvailableMetroPort,
  findDedicatedEmulator,
  logcatArguments,
  parseAdbDevices,
  parsePackageUid,
  sessionLogPaths,
  sessionRecord,
  spawnEmulator,
  spawnExpo,
  spawnMetro,
  waitForMetro,
} from "../../scripts/run-android-with-logs.mjs";

test("uses ANDROID_SDK_ROOT before ANDROID_HOME", () => {
  assert.equal(resolveSdkRoot({ env: { ANDROID_SDK_ROOT: "/sdk/root", ANDROID_HOME: "/sdk/home" } }), resolve("/sdk/root"));
  assert.equal(resolveSdkRoot({ env: { ANDROID_HOME: "/sdk/home" } }), resolve("/sdk/home"));
});

test("uses only modern command-line tools and gives an actionable failure", () => {
  const sdkRoot = mkdtempSync(join(tmpdir(), "home-dashboard-sdk-"));
  try {
    const expected = toolPaths(sdkRoot);
    assert.equal(expected.sdkmanager, join(sdkRoot, MODERN_TOOL_DIRECTORY, "sdkmanager"));
    assert.throws(
      () => resolveAndroidTools(sdkRoot),
      (error) => error.message.includes("official Android SDK Command-line Tools")
        && error.message.includes("cmdline-tools/latest")
        && error.message.includes("legacy <sdk>/tools/bin"),
    );
    assert.equal(modernToolInstallationMessage(sdkRoot).includes("Java 21"), true);
  } finally {
    rmSync(sdkRoot, { recursive: true, force: true });
  }
});

test("keeps target constants exact and recognizes only the dedicated AVD", () => {
  assert.equal(ANDROID_PACKAGE, "com.zhna123.homedashboard.v2");
  assert.equal(AVD_NAME, "Home_Dashboard_API_36");
  assert.equal(ANDROID_PLATFORM, "platforms;android-36");
  assert.equal(ANDROID_SYSTEM_IMAGE, "system-images;android-36;google_apis;x86_64");
  assert.equal(avdIsListed(`Name: ${AVD_NAME}\nDevice: pixel_9_pro`), true);
  assert.equal(avdIsListed("Name: Wear_OS_Large_Round\nDevice: wearos_large_round"), false);
});

test("selects the matching emulator deterministically and ignores a phone", async () => {
  const calls = [];
  const run = (_command, args) => {
    calls.push(args);
    if (args[0] === "devices") {
      return {
        status: 0,
        stdout: "List of devices attached\nRANDOM_PHONE device product:phone\nemulator-5556 device\nemulator-5554 device\n",
        stderr: "",
      };
    }
    const serial = args[1];
    return {
      status: 0,
      stdout: serial === "emulator-5554" ? "Home_Dashboard_API_36\n" : "Other_AVD\n",
      stderr: "",
    };
  };
  assert.equal(await findDedicatedEmulator({ adb: "/sdk/platform-tools/adb", run }), "emulator-5554");
  assert.deepEqual(calls.slice(1).map((args) => args[1]), ["emulator-5554"]);
});

test("starts the reusable emulator outside the terminal process group", () => {
  let invocation;
  const child = { exitCode: null };
  assert.equal(spawnEmulator("/sdk/emulator", {
    spawnProcess: (command, args, options) => {
      invocation = { command, args, options };
      return child;
    },
  }), child);
  assert.equal(invocation.command, "/sdk/emulator");
  assert.equal(invocation.options.detached, true);
  assert.deepEqual(invocation.options.stdio, ["ignore", "pipe", "pipe"]);
});

test("keeps Metro separate and passes Expo the AVD name with the selected serial", () => {
  const invocations = [];
  const children = [{ exitCode: null }, { exitCode: null }];
  const spawnProcess = (command, args, options) => {
    invocations.push({ command, args, options });
    return children[invocations.length - 1];
  };
  const env = { EXISTING_VALUE: "kept" };
  assert.equal(spawnMetro("emulator-5554", { port: 8181, env, spawnProcess }), children[0]);

  let invocation;
  const child = { exitCode: null };
  const result = spawnExpo("emulator-5554", {
    port: 8181,
    env,
    spawnProcess: (command, args, options) => {
      invocation = { command, args, options };
      return child;
    },
  });

  assert.equal(result, child);
  assert.deepEqual(invocations[0].args, ["start", "--dev-client", "--localhost", "--port", "8181"]);
  assert.equal(invocations[0].options.env.ANDROID_SERIAL, "emulator-5554");
  assert.deepEqual(invocations[0].options.stdio, ["ignore", "pipe", "pipe"]);
  assert.match(invocation.command, /node_modules\/\.bin\/expo$/);
  assert.deepEqual(invocation.args, ["run:android", "--device", AVD_NAME, "--port", "8181"]);
  assert.equal(invocation.options.env.ANDROID_SERIAL, "emulator-5554");
  assert.equal(invocation.options.env.EXPO_NO_TELEMETRY, "1");
  assert.equal(invocation.options.env.EXISTING_VALUE, "kept");
  assert.deepEqual(invocation.options.stdio, ["ignore", "pipe", "pipe"]);
});

test("waits for Metro and reports early server exit", async () => {
  let checks = 0;
  assert.equal(await waitForMetro({
    child: { exitCode: null },
    check: async () => ++checks === 2,
    sleep: async () => undefined,
  }), DEFAULT_HOST_METRO_PORT);
  await assert.rejects(
    waitForMetro({ child: { exitCode: 1 }, port: 8181, check: async () => false }),
    /Metro exited before port 8181 was ready/,
  );
});

test("selects an unused Metro port and maps the same device port to it", async () => {
  const checked = [];
  const port = await findAvailableMetroPort({
    startPort: 8181,
    check: async (_host, candidate) => {
      checked.push(candidate);
      return candidate === 8183;
    },
  });
  assert.equal(port, 8183);
  assert.deepEqual(checked, [8181, 8182, 8183]);
  assert.deepEqual(
    adbReverseArguments("emulator-5554", port),
    ["-s", "emulator-5554", "reverse", "tcp:8183", "tcp:8183"],
  );
});

test("formats package-scoped Logcat and parses UID forms", () => {
  assert.equal(parsePackageUid("package:com.zhna123.homedashboard.v2 uid:10234"), 10234);
  assert.equal(parsePackageUid("userId=10235"), 10235);
  assert.deepEqual(
    logcatArguments("emulator-5554", 10234, "08-24 18:00:00.000"),
    ["-s", "emulator-5554", "logcat", "--uid=10234", "-T", "08-24 18:00:00.000", "-v", "threadtime"],
  );
});

test("labels split and partial lines, and writes identical archive/latest records", () => {
  const lines = [];
  const accumulator = new LineAccumulator((line) => lines.push(line));
  accumulator.push("first\nsecond");
  accumulator.push(" part\nthird");
  accumulator.flush();
  assert.deepEqual(lines, ["first", "second part", "third"]);

  const directory = mkdtempSync(join(tmpdir(), "home-dashboard-logs-"));
  try {
    const paths = sessionLogPaths(directory, new Date(2026, 7, 24, 18, 1, 2));
    const writer = new SessionLogWriter(paths);
    writer.write("runner", "session.started", new Date("2026-08-24T22:01:02.000Z"));
    writer.write("expo", "HOME_DASHBOARD {\"event\":\"bootstrap.completed\"}", new Date("2026-08-24T22:01:03.000Z"));
    assert.equal(readFileSync(paths.archive, "utf8"), readFileSync(paths.latest, "utf8"));
    assert.match(readFileSync(paths.latest, "utf8"), /\[expo\] HOME_DASHBOARD/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("session record always has timestamp and an allowed source", () => {
  assert.equal(
    sessionRecord("unknown", "partial", new Date("2026-08-24T22:01:02.000Z")),
    "2026-08-24T22:01:02.000Z [runner] partial",
  );
});

test("README npm commands all resolve to package scripts", () => {
  const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
  const readme = readFileSync(resolve("README.md"), "utf8");
  const commands = [...readme.matchAll(/npm run ([a-z0-9:_-]+)/g)].map((match) => match[1]);
  assert.ok(commands.length > 0);
  for (const command of commands) assert.equal(typeof packageJson.scripts[command], "string", `missing npm script ${command}`);
});

test("cleanup sends termination signals and preserves the emulator as a separate concern", async () => {
  class FakeChild extends EventEmitter {
    constructor() {
      super();
      this.exitCode = null;
      this.signalCode = null;
      this.signals = [];
    }

    kill(signal) {
      this.signals.push(signal);
      this.signalCode = signal;
      this.exitCode = signal === "SIGKILL" ? 137 : 0;
      queueMicrotask(() => this.emit("close", this.exitCode, signal));
      return true;
    }
  }

  const expo = new FakeChild();
  const logcat = new FakeChild();
  await cleanupChildren([logcat, expo], { graceMs: 0 });
  assert.deepEqual(logcat.signals, ["SIGTERM"]);
  assert.deepEqual(expo.signals, ["SIGTERM"]);
});

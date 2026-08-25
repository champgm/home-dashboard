import { accessSync, appendFileSync, constants, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createConnection, createServer } from "node:net";
import {
  ANDROID_PACKAGE,
  AVD_NAME,
  ANDROID_PLATFORM,
  ANDROID_SYSTEM_IMAGE,
  avdConfigPath,
  modernToolInstallationMessage,
  resolveSdkRoot,
  toolPaths,
  runCommand,
} from "./setup-android-debug.mjs";

export const SESSION_LOG_DIRECTORY = "logs";
export const SESSION_LOG_PREFIX = "android-";
export const SESSION_LOG_SOURCE_NAMES = Object.freeze(["runner", "expo", "device"]);
export const DEFAULT_BOOT_TIMEOUT_MS = 180_000;
export const DEFAULT_PACKAGE_TIMEOUT_MS = 180_000;
export const DEFAULT_HOST_METRO_PORT = 8082;

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

function pad(value, length = 2) {
  return String(value).padStart(length, "0");
}

export function sessionTimestamp(date = new Date()) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("") + "-" + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

export function sessionLogPaths(logDirectory = join(repoRoot, SESSION_LOG_DIRECTORY), date = new Date()) {
  mkdirSync(logDirectory, { recursive: true });
  const base = join(logDirectory, `${SESSION_LOG_PREFIX}${sessionTimestamp(date)}`);
  let archive = `${base}.log`;
  let suffix = 1;
  while (existsSync(archive)) {
    archive = `${base}-${pad(suffix)}.log`;
    suffix += 1;
  }
  return { archive, latest: join(logDirectory, "latest.log") };
}

export function sessionRecord(source, message, date = new Date()) {
  const safeSource = SESSION_LOG_SOURCE_NAMES.includes(source) ? source : "runner";
  const safeMessage = String(message).replace(/\r?\n/g, "\\n");
  return `${date.toISOString()} [${safeSource}] ${safeMessage}`;
}

export class SessionLogWriter {
  constructor(paths, date = new Date()) {
    this.paths = paths;
    this.sessionStartedAt = date;
    // A new session always starts a fresh latest file. The archive is also
    // created here so a preflight failure still leaves an inspectable record.
    writeFileSync(paths.archive, "", { flag: "wx" });
    writeFileSync(paths.latest, "");
  }

  write(source, message, date = new Date()) {
    const line = sessionRecord(source, message, date);
    appendFileSync(this.paths.archive, `${line}\n`);
    appendFileSync(this.paths.latest, `${line}\n`);
    return line;
  }
}

export class LineAccumulator {
  constructor(writeLine) {
    this.writeLine = writeLine;
    this.buffer = "";
  }

  push(chunk) {
    this.buffer += String(chunk);
    const lines = this.buffer.split(/\n/);
    this.buffer = lines.pop() || "";
    for (const line of lines) this.writeLine(line.replace(/\r$/, ""));
  }

  flush() {
    if (this.buffer.length > 0) {
      this.writeLine(this.buffer.replace(/\r$/, ""));
      this.buffer = "";
    }
  }
}

export function attachLabeledStream(stream, source, writer, dateFactory = () => new Date()) {
  const accumulator = new LineAccumulator((line) => writer.write(source, line, dateFactory()));
  if (!stream || typeof stream.on !== "function") return { flush: () => accumulator.flush() };
  if (typeof stream.setEncoding === "function") stream.setEncoding("utf8");
  stream.on("data", (chunk) => accumulator.push(chunk));
  const flush = () => accumulator.flush();
  stream.on("end", flush);
  stream.on("close", flush);
  return { flush };
}

export function parseAdbDevices(output) {
  return String(output)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("List of devices"))
    .map((line) => {
      const fields = line.split(/\s+/);
      return {
        serial: fields[0],
        state: fields[1] || "unknown",
        details: fields.slice(2),
      };
    })
    .filter((device) => Boolean(device.serial));
}

export function parsePackageUid(output) {
  const match = String(output).match(/(?:uid|userId)\s*[:=]?\s*(\d+)/i);
  return match ? Number(match[1]) : undefined;
}

export function logcatArguments(serial, uid, boundary) {
  return ["-s", serial, "logcat", `--uid=${uid}`, "-T", boundary, "-v", "threadtime"];
}

export function logcatBoundary(date = new Date()) {
  return [
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + " " + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join(":") + `.${pad(date.getMilliseconds(), 3)}`;
}

function isExecutable(path) {
  if (!existsSync(path)) return false;
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch (_error) {
    return process.platform === "win32";
  }
}

function reportCheck(checks, report, name, ok, detail) {
  const check = { name, ok, detail };
  checks.push(check);
  report(`${ok ? "PASS" : "FAIL"} ${name}: ${detail}`);
  return ok;
}

function outputSummary(result) {
  const output = `${result.stdout || ""}\n${result.stderr || ""}\n${result.error ? `${result.error.code || "spawn-error"}: ${result.error.message || result.error}` : ""}`.trim().replace(/\s+/g, " ");
  return output ? output.slice(-300) : "no output";
}

export async function runPreflight({
  env = process.env,
  platform = process.platform,
  run = runCommand,
  report = console.log,
} = {}) {
  const checks = [];
  report("Home Dashboard Android development preflight");
  report(`Next command after a passing preflight: npm run dev:android`);
  report(`Setup command when the target is absent: npm run setup:android`);

  reportCheck(checks, report, "Node.js", Boolean(process.version), process.version);

  const npm = run("npm", ["--version"], { env });
  reportCheck(checks, report, "npm", npm.status === 0, npm.status === 0 ? npm.stdout.trim() : outputSummary(npm));

  const java = run("java", ["-version"], { env });
  reportCheck(checks, report, "Java", java.status === 0, java.status === 0 ? outputSummary(java) : outputSummary(java));

  let sdkRoot;
  let tools;
  try {
    sdkRoot = resolveSdkRoot({ env, platform });
    reportCheck(checks, report, "Android SDK", true, sdkRoot);
  } catch (error) {
    reportCheck(checks, report, "Android SDK", false, error instanceof Error ? error.message : String(error));
  }

  if (sdkRoot) {
    tools = toolPaths(sdkRoot, platform);
    for (const [name, path] of Object.entries(tools)) {
      const required = ["adb", "emulator", "sdkmanager", "avdmanager"].includes(name);
      reportCheck(checks, report, `Android ${name}`, !required || isExecutable(path), path);
    }

    const modernReady = isExecutable(tools.sdkmanager) && isExecutable(tools.avdmanager);
    if (!modernReady) {
      reportCheck(checks, report, "Modern Android command-line tools", false, modernToolInstallationMessage(sdkRoot));
    } else {
      reportCheck(checks, report, "Modern Android command-line tools", true, "cmdline-tools/latest");
    }

    const platformPath = join(sdkRoot, "platforms", "android-36");
    const imagePath = join(sdkRoot, "system-images", "android-36", "google_apis", "x86_64");
    reportCheck(checks, report, ANDROID_PLATFORM, existsSync(platformPath), platformPath);
    reportCheck(checks, report, ANDROID_SYSTEM_IMAGE, existsSync(imagePath), imagePath);

    if (isExecutable(tools.avdmanager)) {
      const listed = run(tools.avdmanager, ["list", "avd"], { env });
      const hasAvd = listed.status === 0 && new RegExp(`(?:^|\\n)\\s*Name:\\s*${AVD_NAME}\\s*(?:\\n|$)`, "i").test(listed.stdout);
      reportCheck(checks, report, `AVD ${AVD_NAME}`, hasAvd, hasAvd ? "dedicated phone AVD found" : outputSummary(listed));
      reportCheck(checks, report, "AVD config", existsSync(avdConfigPath(AVD_NAME, env)), avdConfigPath(AVD_NAME, env));
    } else {
      reportCheck(checks, report, `AVD ${AVD_NAME}`, false, "Run npm run setup:android after installing modern command-line tools.");
    }

    if (isExecutable(tools.adb)) {
      const devices = run(tools.adb, ["devices", "-l"], { env });
      if (devices.status === 0) {
        const parsed = parseAdbDevices(devices.stdout);
        reportCheck(checks, report, "ADB connected-device query", true, parsed.length ? parsed.map((device) => `${device.serial}:${device.state}`).join(", ") : "no connected devices");
      } else {
        reportCheck(checks, report, "ADB connected-device query", false, `ADB access/daemon/host permission issue: ${outputSummary(devices)}`);
      }
    } else {
      reportCheck(checks, report, "ADB connected-device query", false, "adb is unavailable");
    }
  }

  if (platform === "linux") {
    let kvm = false;
    try {
      accessSync("/dev/kvm", constants.R_OK | constants.W_OK);
      kvm = true;
    } catch (_error) {
      kvm = false;
    }
    reportCheck(checks, report, "Linux virtualization (/dev/kvm)", kvm, kvm ? "read/write access" : "missing or inaccessible; enable host virtualization or permissions");
  } else {
    reportCheck(checks, report, "Host virtualization", true, "platform-specific emulator check is deferred to emulator startup");
  }

  const ok = checks.every((check) => check.ok);
  report(ok
    ? "Preflight result: PASS — npm run dev:android"
    : "Preflight result: FAIL — install/fix the listed prerequisite, then run npm run dev:android:check again");
  return { ok, checks, sdkRoot, tools, nextCommand: ok ? "npm run dev:android" : "npm run setup:android" };
}

export async function listConnectedDevices(adb, { env = process.env, run = runCommand } = {}) {
  const result = run(adb, ["devices", "-l"], { env });
  if (result.status !== 0) throw new Error(`ADB device query failed: ${outputSummary(result)}`);
  return parseAdbDevices(result.stdout);
}

export async function findDedicatedEmulator({ adb, avd = AVD_NAME, env = process.env, run = runCommand } = {}) {
  const devices = await listConnectedDevices(adb, { env, run });
  const candidates = devices
    .filter((device) => device.state === "device" && /^emulator-\d+$/.test(device.serial))
    .sort((left, right) => left.serial.localeCompare(right.serial));
  for (const device of candidates) {
    const result = run(adb, ["-s", device.serial, "shell", "getprop", "ro.boot.qemu.avd_name"], { env });
    if (result.status === 0 && result.stdout.trim() === avd) return device.serial;
  }
  return undefined;
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

export async function waitForDedicatedEmulator({
  adb,
  avd = AVD_NAME,
  env = process.env,
  run = runCommand,
  sleep = delay,
  timeoutMs = DEFAULT_BOOT_TIMEOUT_MS,
  intervalMs = 1000,
} = {}) {
  const started = Date.now();
  while (Date.now() - started <= timeoutMs) {
    const serial = await findDedicatedEmulator({ adb, avd, env, run });
    if (serial) return serial;
    await sleep(intervalMs);
  }
  throw new Error(`Timed out waiting for dedicated emulator ${avd} to connect within ${timeoutMs}ms.`);
}

export async function waitForBoot({
  adb,
  serial,
  env = process.env,
  run = runCommand,
  sleep = delay,
  timeoutMs = DEFAULT_BOOT_TIMEOUT_MS,
  intervalMs = 1000,
} = {}) {
  const started = Date.now();
  while (Date.now() - started <= timeoutMs) {
    const result = run(adb, ["-s", serial, "shell", "getprop", "sys.boot_completed"], { env });
    if (result.status === 0 && result.stdout.trim() === "1") return serial;
    await sleep(intervalMs);
  }
  throw new Error(`Timed out waiting for ${serial} to report sys.boot_completed=1 within ${timeoutMs}ms.`);
}

export function spawnEmulator(emulator, { avd = AVD_NAME, spawnProcess = spawn, env = process.env } = {}) {
  const args = ["-avd", avd, "-no-snapshot-load", "-no-snapshot-save", "-netdelay", "none", "-netspeed", "full"];
  // A separate process group prevents terminal Ctrl+C from shutting down the
  // reusable emulator along with the foreground development session.
  return spawnProcess(emulator, args, { env, detached: true, stdio: ["ignore", "pipe", "pipe"] });
}

export async function waitForPackageUid({
  adb,
  serial,
  packageName = ANDROID_PACKAGE,
  env = process.env,
  run = runCommand,
  sleep = delay,
  timeoutMs = DEFAULT_PACKAGE_TIMEOUT_MS,
  intervalMs = 1000,
  child,
} = {}) {
  const started = Date.now();
  while (Date.now() - started <= timeoutMs) {
    const result = run(adb, ["-s", serial, "shell", "cmd", "package", "list", "packages", "-U", packageName], { env });
    const uid = result.status === 0 ? parsePackageUid(result.stdout) : undefined;
    if (uid !== undefined) return uid;
    if (child && child.exitCode !== null && child.exitCode !== undefined) {
      throw new Error(`Expo exited before ${packageName} was installed (code ${child.exitCode}).`);
    }
    await sleep(intervalMs);
  }
  throw new Error(`Timed out waiting for installed package ${packageName} on ${serial}.`);
}

function childExit(child) {
  if (!child) return Promise.resolve({ code: 0, signal: undefined });
  if (child.exitCode !== null && child.exitCode !== undefined) return Promise.resolve({ code: child.exitCode, signal: child.signalCode });
  return new Promise((resolveExit) => child.once("close", (code, signal) => resolveExit({ code, signal })));
}

export async function cleanupChildren(children, { graceMs = 1500 } = {}) {
  const active = children.filter(Boolean);
  for (const child of active) {
    if (child.exitCode === null || child.exitCode === undefined) {
      try { child.kill("SIGTERM"); } catch (_error) { /* already gone */ }
    }
  }
  await Promise.all(active.map(async (child) => {
    if (child.exitCode !== null && child.exitCode !== undefined) return;
    if (typeof child.once !== "function") return;
    await Promise.race([childExit(child), delay(graceMs)]);
    if (child.exitCode === null || child.exitCode === undefined) {
      try { child.kill("SIGKILL"); } catch (_error) { /* already gone */ }
    }
  }));
}

function expoExecutable() {
  const name = process.platform === "win32" ? "expo.cmd" : "expo";
  return join(repoRoot, "node_modules", ".bin", name);
}

export function spawnMetro(serial, {
  port = DEFAULT_HOST_METRO_PORT,
  spawnProcess = spawn,
  env = process.env,
} = {}) {
  const executable = expoExecutable();
  if (!isExecutable(executable)) {
    throw new Error("Repository-local Expo CLI is missing. Run npm ci, then rerun npm run dev:android.");
  }
  const childEnv = { ...env, ANDROID_SERIAL: serial, EXPO_NO_TELEMETRY: "1" };
  return spawnProcess(executable, ["start", "--dev-client", "--localhost", "--port", String(port)], {
    cwd: repoRoot,
    env: childEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function spawnExpo(serial, {
  port = DEFAULT_HOST_METRO_PORT,
  spawnProcess = spawn,
  env = process.env,
} = {}) {
  const executable = expoExecutable();
  if (!isExecutable(executable)) {
    throw new Error("Repository-local Expo CLI is missing. Run npm ci, then rerun npm run dev:android.");
  }
  const childEnv = { ...env, ANDROID_SERIAL: serial, EXPO_NO_TELEMETRY: "1" };
  // Expo resolves --device by AVD/device name, not by the emulator's ADB
  // serial. Passing the already-running Metro port makes Gradle embed the
  // correct endpoint in the debug APK; Expo reuses that server instead of
  // owning its lifecycle.
  return spawnProcess(executable, ["run:android", "--device", AVD_NAME, "--port", String(port)], {
    cwd: repoRoot,
    env: childEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function metroPortIsOpen(host = "127.0.0.1", port = DEFAULT_HOST_METRO_PORT) {
  return new Promise((resolveOpen) => {
    const socket = createConnection({ host, port });
    const finish = (open) => {
      socket.removeAllListeners();
      socket.destroy();
      resolveOpen(open);
    };
    socket.setTimeout(500);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

function metroPortIsAvailable(host = "127.0.0.1", port = DEFAULT_HOST_METRO_PORT) {
  return new Promise((resolveAvailable) => {
    const server = createServer();
    server.unref();
    server.once("error", () => resolveAvailable(false));
    server.listen({ host, port, exclusive: true }, () => {
      server.close(() => resolveAvailable(true));
    });
  });
}

export async function findAvailableMetroPort({
  host = "127.0.0.1",
  startPort = DEFAULT_HOST_METRO_PORT,
  attempts = 100,
  check = metroPortIsAvailable,
} = {}) {
  for (let offset = 0; offset < attempts; offset += 1) {
    const port = startPort + offset;
    if (await check(host, port)) return port;
  }
  throw new Error(`No available host port found for Metro in ${startPort}-${startPort + attempts - 1}.`);
}

export function adbReverseArguments(serial, hostPort, devicePort = hostPort) {
  return ["-s", serial, "reverse", `tcp:${devicePort}`, `tcp:${hostPort}`];
}

export async function waitForMetro({
  child,
  port = DEFAULT_HOST_METRO_PORT,
  host = "127.0.0.1",
  sleep = delay,
  check = metroPortIsOpen,
  timeoutMs = 60_000,
  intervalMs = 250,
} = {}) {
  const started = Date.now();
  while (Date.now() - started <= timeoutMs) {
    if (await check(host, port)) return port;
    if (child && child.exitCode !== null && child.exitCode !== undefined) {
      throw new Error(`Metro exited before port ${port} was ready (code ${child.exitCode}).`);
    }
    await sleep(intervalMs);
  }
  throw new Error(`Timed out waiting for Metro on ${host}:${port} within ${timeoutMs}ms.`);
}

function spawnLogcat(adb, serial, uid, boundary, { spawnProcess = spawn, env = process.env } = {}) {
  return spawnProcess(adb, logcatArguments(serial, uid, boundary), {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}

export async function runAndroidSession({
  env = process.env,
  platform = process.platform,
  logDirectory = join(repoRoot, SESSION_LOG_DIRECTORY),
  now = () => new Date(),
  run = runCommand,
  spawnProcess = spawn,
  report = (line) => console.log(line),
  sleep = delay,
} = {}) {
  const startedAt = now();
  const paths = sessionLogPaths(logDirectory, startedAt);
  const writer = new SessionLogWriter(paths, startedAt);
  report(`Session archive: ${paths.archive}`);
  report(`Latest session log: ${paths.latest}`);
  writer.write("runner", `session.started archive=${paths.archive} latest=${paths.latest}`, startedAt);

  let emulatorChild;
  let metroChild;
  let expoChild;
  let logcatChild;
  let sigintHandler;
  let sigtermHandler;
  let terminalResult = 1;
  try {
    const preflight = await runPreflight({
      env,
      platform,
      run,
      report: (line) => {
        report(line);
        writer.write("runner", line);
      },
    });
    if (!preflight.ok || !preflight.sdkRoot || !preflight.tools) {
      throw new Error(`Preflight failed. Run ${preflight.nextCommand} after fixing the listed prerequisite.`);
    }

    const { adb, emulator } = preflight.tools;
    let serial = await findDedicatedEmulator({ adb, avd: AVD_NAME, env, run });
    if (!serial) {
      writer.write("runner", `emulator.start avd=${AVD_NAME}`);
      emulatorChild = spawnEmulator(emulator, { avd: AVD_NAME, spawnProcess, env });
      attachLabeledStream(emulatorChild.stdout, "runner", writer);
      attachLabeledStream(emulatorChild.stderr, "runner", writer);
      serial = await waitForDedicatedEmulator({ adb, avd: AVD_NAME, env, run, sleep });
    } else {
      writer.write("runner", `emulator.reuse avd=${AVD_NAME} serial=${serial}`);
    }
    await waitForBoot({ adb, serial, env, run, sleep });
    writer.write("runner", `emulator.ready avd=${AVD_NAME} serial=${serial}`);

    const hostMetroPort = await findAvailableMetroPort();
    writer.write("runner", `metro.port-selected port=${hostMetroPort}`);
    metroChild = spawnMetro(serial, { port: hostMetroPort, spawnProcess, env });
    attachLabeledStream(metroChild.stdout, "expo", writer);
    attachLabeledStream(metroChild.stderr, "expo", writer);
    writer.write("runner", `metro.started port=${hostMetroPort} serial=${serial}`);
    await waitForMetro({ child: metroChild, port: hostMetroPort, sleep });
    writer.write("runner", `metro.ready port=${hostMetroPort}`);

    const reverseArgs = adbReverseArguments(serial, hostMetroPort);
    const reverse = run(adb, reverseArgs, { env });
    if (reverse.status !== 0) {
      throw new Error(`ADB reverse failed: ${outputSummary(reverse)}`);
    }
    writer.write("runner", `adb.reverse serial=${serial} devicePort=${hostMetroPort} hostPort=${hostMetroPort}`);

    expoChild = spawnExpo(serial, { port: hostMetroPort, spawnProcess, env });
    attachLabeledStream(expoChild.stdout, "expo", writer);
    attachLabeledStream(expoChild.stderr, "expo", writer);
    writer.write("runner", `expo.started package=${ANDROID_PACKAGE} serial=${serial}`);

    const uid = await waitForPackageUid({ adb, serial, env, run, sleep, child: expoChild });
    const boundary = logcatBoundary(startedAt);
    logcatChild = spawnLogcat(adb, serial, uid, boundary, { spawnProcess, env });
    attachLabeledStream(logcatChild.stdout, "device", writer);
    attachLabeledStream(logcatChild.stderr, "device", writer);
    writer.write("runner", `logcat.started package=${ANDROID_PACKAGE} uid=${uid} serial=${serial} boundary=${boundary}`);

    const expoExit = await childExit(expoChild);
    if (expoExit.code !== 0) {
      throw new Error(`Expo build/install exited unexpectedly with code ${expoExit.code ?? "null"}.`);
    }
    writer.write("runner", "expo.build-install.completed code=0");

    let resolveStopSignal;
    const stopSignal = new Promise((resolveSignal) => {
      resolveStopSignal = resolveSignal;
    });
    const onSignal = (received) => {
      writer.write("runner", `session.stop signal=${received}`);
      resolveStopSignal({ kind: "signal", exit: { code: 0 } });
    };
    sigintHandler = () => onSignal("SIGINT");
    sigtermHandler = () => onSignal("SIGTERM");
    process.once("SIGINT", sigintHandler);
    process.once("SIGTERM", sigtermHandler);

    const result = await Promise.race([
      childExit(metroChild).then((exit) => ({ kind: "metro", exit })),
      childExit(logcatChild).then((exit) => ({ kind: "device", exit })),
      stopSignal,
    ]);
    if (result.kind === "signal") terminalResult = 0;
    else throw new Error(`${result.kind} capture exited unexpectedly with code ${result.exit.code ?? "null"}.`);
  } catch (error) {
    terminalResult = 1;
    writer.write("runner", `session.failed cause=${formatError(error)}`);
    report(`FAIL Android session: ${formatError(error)}`);
  } finally {
    if (sigintHandler) process.removeListener("SIGINT", sigintHandler);
    if (sigtermHandler) process.removeListener("SIGTERM", sigtermHandler);
    await cleanupChildren([logcatChild, expoChild, metroChild], { graceMs: 1500 });
    // The dedicated emulator is intentionally left running for reuse. Unref
    // it and its pipes so the runner process can exit without shutting down
    // the host target it just prepared.
    if (emulatorChild) {
      emulatorChild.stdout?.unref?.();
      emulatorChild.stderr?.unref?.();
      emulatorChild.unref?.();
    }
    writer.write("runner", `session.completed exitCode=${terminalResult}`);
    report(`Session archive: ${paths.archive}`);
    report(`Latest session log: ${paths.latest}`);
  }
  return { exitCode: terminalResult, paths };
}

export async function main() {
  const result = process.argv.includes("--check")
    ? await runPreflight()
    : await runAndroidSession();
  process.exitCode = result.ok === false ? 1 : result.exitCode || 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}

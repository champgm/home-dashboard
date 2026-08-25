import { accessSync, constants, existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const ANDROID_PACKAGE = "com.zhna123.homedashboard.v2";
export const PACKAGE_NAME = ANDROID_PACKAGE;
export const AVD_NAME = "Home_Dashboard_API_36";
export const TARGET_AVD_NAME = AVD_NAME;
export const ANDROID_API = "36";
export const ANDROID_API_LEVEL = 36;
export const ANDROID_PLATFORM = "platforms;android-36";
export const ANDROID_SYSTEM_IMAGE = "system-images;android-36;google_apis;x86_64";
export const SYSTEM_IMAGE = ANDROID_SYSTEM_IMAGE;
export const PIXEL_DEVICE_PROFILE = "pixel_9_pro";
export const MODERN_TOOL_DIRECTORY = "cmdline-tools/latest/bin";

const requiredPackages = [
  "platform-tools",
  "emulator",
  ANDROID_PLATFORM,
  ANDROID_SYSTEM_IMAGE,
];

function executableSuffix(platform = process.platform) {
  return platform === "win32" ? ".exe" : "";
}

function commandLineToolSuffix(platform = process.platform) {
  return platform === "win32" ? ".bat" : "";
}

export function toolPaths(sdkRoot, platform = process.platform) {
  const exe = executableSuffix(platform);
  const bat = commandLineToolSuffix(platform);
  return {
    adb: join(sdkRoot, "platform-tools", `adb${exe}`),
    emulator: join(sdkRoot, "emulator", `emulator${exe}`),
    sdkmanager: join(sdkRoot, MODERN_TOOL_DIRECTORY, `sdkmanager${bat}`),
    avdmanager: join(sdkRoot, MODERN_TOOL_DIRECTORY, `avdmanager${bat}`),
  };
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function discoverExecutable(command, platform = process.platform) {
  const lookup = platform === "win32" ? "where" : "which";
  const result = spawnSync(lookup, [command], { encoding: "utf8" });
  if (result.status !== 0) return undefined;
  return String(result.stdout || "").split(/\r?\n/).map((line) => line.trim()).find(Boolean);
}

function sdkFromExecutable(executable) {
  const normalized = executable.replaceAll("\\", "/");
  const platformTools = "/platform-tools/";
  const emulatorDirectory = "/emulator/";
  const commandLineTools = "/cmdline-tools/";
  const platformIndex = normalized.lastIndexOf(platformTools);
  if (platformIndex >= 0) return normalized.slice(0, platformIndex);
  const emulatorIndex = normalized.lastIndexOf(emulatorDirectory);
  if (emulatorIndex >= 0) return normalized.slice(0, emulatorIndex);
  const commandLineIndex = normalized.lastIndexOf(commandLineTools);
  if (commandLineIndex >= 0) return normalized.slice(0, commandLineIndex);
  return undefined;
}

export function resolveSdkRoot({ env = process.env, platform = process.platform } = {}) {
  const explicit = nonEmpty(env.ANDROID_SDK_ROOT) || nonEmpty(env.ANDROID_HOME);
  if (explicit) return resolve(explicit);

  for (const command of ["adb", "emulator", "sdkmanager"]) {
    const executable = discoverExecutable(command, platform);
    const inferred = executable && sdkFromExecutable(executable);
    if (inferred) return resolve(inferred);
  }

  throw new Error(
    "Android SDK not found. Set ANDROID_SDK_ROOT (preferred) or ANDROID_HOME, then rerun npm run setup:android.",
  );
}

export function modernToolInstallationMessage(sdkRoot) {
  return [
    "Modern Android command-line tools are required.",
    `Install the official Android SDK Command-line Tools (latest) into ${join(sdkRoot, MODERN_TOOL_DIRECTORY)},`,
    "ensuring sdkmanager and avdmanager are present, then rerun npm run setup:android.",
    "The legacy <sdk>/tools/bin tools are intentionally unsupported under Java 21.",
  ].join(" ");
}

function isExecutable(path, platform = process.platform) {
  if (!existsSync(path)) return false;
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch (_error) {
    // Windows does not expose POSIX execute bits. The existence check is the
    // useful signal there; on Unix this remains a clear setup failure.
    return platform === "win32";
  }
}

export function resolveAndroidTools(sdkRoot, platform = process.platform) {
  const tools = toolPaths(sdkRoot, platform);
  const missing = ["sdkmanager", "avdmanager"].filter((name) => !isExecutable(tools[name], platform));
  if (missing.length > 0) throw new Error(modernToolInstallationMessage(sdkRoot));
  return tools;
}

export function avdHome(env = process.env) {
  const explicit = nonEmpty(env.ANDROID_AVD_HOME);
  if (explicit) return resolve(explicit);
  const userHome = nonEmpty(env.ANDROID_USER_HOME);
  return userHome ? join(resolve(userHome), "avd") : join(homedir(), ".android", "avd");
}

export function avdConfigPath(name = AVD_NAME, env = process.env) {
  return join(avdHome(env), `${name}.avd`, "config.ini");
}

export function commandDescription(command, args) {
  return [command, ...args].map((part) => JSON.stringify(String(part))).join(" ");
}

export function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env,
    input: options.input,
    encoding: "utf8",
    timeout: options.timeout,
    maxBuffer: 1024 * 1024 * 8,
  });
  return {
    status: result.error || result.status === null ? 1 : result.status,
    signal: result.signal,
    stdout: String(result.stdout || ""),
    stderr: String(result.stderr || ""),
    error: result.error,
  };
}

function outputTail(result) {
  const output = `${result.stdout}\n${result.stderr}\n${result.error ? `${result.error.code || "spawn-error"}: ${result.error.message || result.error}` : ""}`.trim();
  if (!output) return "(no command output)";
  return output.slice(-2000);
}

function requireSuccess(result, command, args) {
  if (result.status === 0) return result;
  throw new Error([
    `Android setup command failed (${result.status}): ${commandDescription(command, args)}`,
    outputTail(result),
  ].join("\n"));
}

function installedPackage(sdkRoot, packageName) {
  if (packageName === "platform-tools") return existsSync(join(sdkRoot, "platform-tools"));
  if (packageName === "emulator") return existsSync(join(sdkRoot, "emulator"));
  if (packageName === ANDROID_PLATFORM) return existsSync(join(sdkRoot, "platforms", "android-36"));
  if (packageName === ANDROID_SYSTEM_IMAGE) {
    return existsSync(join(sdkRoot, "system-images", "android-36", "google_apis", "x86_64"));
  }
  return false;
}

function readAvdList(result) {
  return `${result.stdout}\n${result.stderr}`;
}

export function avdIsListed(output, name = AVD_NAME) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\n)\\s*Name:\\s*${escaped}\\s*(?:\\n|$)`, "i").test(output)
    || new RegExp(`(?:^|\\n)\\s*${escaped}\\s*(?:\\n|$)`, "i").test(output);
}

function setIniValues(path, values) {
  const existing = existsSync(path) ? readFileSync(path, "utf8").split(/\r?\n/) : [];
  const keys = new Set(Object.keys(values));
  const lines = existing.map((line) => {
    const match = line.match(/^([^=]+)=/);
    if (!match || !keys.has(match[1])) return line;
    const key = match[1];
    keys.delete(key);
    return `${key}=${values[key]}`;
  });
  for (const key of keys) lines.push(`${key}=${values[key]}`);
  writeFileSync(path, `${lines.filter((line, index) => index < lines.length - 1 || line.length > 0).join("\n")}\n`, "utf8");
}

function ensureDedicatedAvdConfig(env) {
  const configPath = avdConfigPath(AVD_NAME, env);
  if (!existsSync(configPath)) {
    throw new Error(`AVD ${AVD_NAME} was not created; expected ${configPath}.`);
  }
  setIniValues(configPath, {
    "abi.type": "x86_64",
    "hw.cpu.arch": "x86_64",
    "hw.initialOrientation": "Portrait",
    "hw.keyboard": "yes",
    "hw.ramSize": "2048",
    "disk.dataPartition.size": "4G",
  });
  return configPath;
}

export async function setupAndroid({
  env = process.env,
  platform = process.platform,
  run = runCommand,
  log = console.log,
} = {}) {
  const sdkRoot = resolveSdkRoot({ env, platform });
  const tools = resolveAndroidTools(sdkRoot, platform);
  const commandEnv = { ...env, ANDROID_SDK_ROOT: sdkRoot, ANDROID_HOME: sdkRoot };
  log(`Android SDK: ${sdkRoot}`);
  log(`Target image: ${ANDROID_SYSTEM_IMAGE}`);
  log(`Dedicated AVD: ${AVD_NAME}`);

  const licenseArgs = [`--sdk_root=${sdkRoot}`, "--licenses"];
  requireSuccess(run(tools.sdkmanager, licenseArgs, { input: `${"y\n".repeat(100)}`, env: commandEnv }), tools.sdkmanager, licenseArgs);

  const packageArgs = [`--sdk_root=${sdkRoot}`, ...requiredPackages];
  requireSuccess(run(tools.sdkmanager, packageArgs, { env: commandEnv }), tools.sdkmanager, packageArgs);
  const missingPackages = requiredPackages.filter((packageName) => !installedPackage(sdkRoot, packageName));
  if (missingPackages.length > 0) {
    throw new Error(`Android SDK packages are still missing after sdkmanager: ${missingPackages.join(", ")}.`);
  }

  const listArgs = ["list", "avd"];
  const listed = run(tools.avdmanager, listArgs, { env: commandEnv });
  requireSuccess(listed, tools.avdmanager, listArgs);
  const alreadyExists = avdIsListed(readAvdList(listed), AVD_NAME) || existsSync(avdConfigPath(AVD_NAME, env));
  if (!alreadyExists) {
    const createArgs = [
      "create", "avd", "--name", AVD_NAME,
      "--package", ANDROID_SYSTEM_IMAGE,
      "--device", PIXEL_DEVICE_PROFILE,
      "--sdcard", "512M",
    ];
    requireSuccess(run(tools.avdmanager, createArgs, { input: "no\n", env: commandEnv }), tools.avdmanager, createArgs);
  }

  const configPath = ensureDedicatedAvdConfig(env);
  log(`Ready: ${AVD_NAME} (${configPath})`);
  return { sdkRoot, tools, avd: AVD_NAME, image: ANDROID_SYSTEM_IMAGE, configPath };
}

export async function main() {
  try {
    await setupAndroid();
  } catch (error) {
    console.error(`FAIL setup: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}

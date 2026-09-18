#!/usr/bin/env node

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pocRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packagePath = join(pocRoot, 'package.json');
const packageLockPath = join(pocRoot, 'package-lock.json');
const appPath = join(pocRoot, 'app.json');
const metadataPaths = [packagePath, packageLockPath, appPath];
const originals = new Map(metadataPaths.map((path) => [path, readFileSync(path, 'utf8')]));

function parseJson(path) {
  return JSON.parse(originals.get(path));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    cwd: pocRoot,
    env,
    stdio: 'inherit'
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}

const packageJson = parseJson(packagePath);
const packageLock = parseJson(packageLockPath);
const appJson = parseJson(appPath);
const versionMatch = /^(\d+)\.(\d+)\.(\d+)$/.exec(packageJson.version);

if (!versionMatch) {
  throw new Error(`Expected a major.minor.patch version, received ${packageJson.version}`);
}
if (appJson.expo?.version !== packageJson.version) {
  throw new Error(`package.json (${packageJson.version}) and app.json (${appJson.expo?.version}) versions do not match`);
}
if (!Number.isInteger(appJson.expo?.android?.versionCode)) {
  throw new Error('app.json expo.android.versionCode must be an integer');
}

const nextVersion = `${versionMatch[1]}.${versionMatch[2]}.${Number(versionMatch[3]) + 1}`;
const nextVersionCode = appJson.expo.android.versionCode + 1;
const apkSource = join(pocRoot, 'android/app/build/outputs/apk/release/app-release.apk');
const apkFilename = `ecobee-hap-poc-v${nextVersion}.apk`;
const apkDestination = join(pocRoot, 'dist', apkFilename);
const syncedApkDestination = join(
  homedir(),
  'Insync',
  'gilbertmccoy@gmail.com',
  'Google Drive',
  'APKs',
  apkFilename
);
let metadataChanged = false;

try {
  packageJson.version = nextVersion;
  packageLock.version = nextVersion;
  if (packageLock.packages?.['']) packageLock.packages[''].version = nextVersion;
  appJson.expo.version = nextVersion;
  appJson.expo.android.versionCode = nextVersionCode;

  metadataChanged = true;
  writeJson(packagePath, packageJson);
  writeJson(packageLockPath, packageLock);
  writeJson(appPath, appJson);

  console.log(`Building Ecobee HAP POC ${nextVersion} (versionCode ${nextVersionCode})...`);
  run('npx', ['expo', 'prebuild', '--clean', '--platform', 'android', '--no-install']);
  run(
    './android/gradlew',
    [
      '-p',
      'android',
      'assembleRelease',
      '-Dorg.gradle.jvmargs=-Xmx6144m -XX:MaxMetaspaceSize=1024m',
      '--no-daemon'
    ],
    { ...process.env, NODE_ENV: 'production' }
  );

  mkdirSync(dirname(apkDestination), { recursive: true });
  copyFileSync(apkSource, apkDestination);
  console.log(`APK created: ${apkDestination}`);

  mkdirSync(dirname(syncedApkDestination), { recursive: true });
  copyFileSync(apkDestination, syncedApkDestination);
  console.log(`APK copied to: ${syncedApkDestination}`);
} catch (error) {
  if (metadataChanged) {
    for (const [path, content] of originals) writeFileSync(path, content);
    console.error('Build failed; version metadata was restored.');
  }
  throw error;
}

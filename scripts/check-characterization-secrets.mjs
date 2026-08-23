import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const roots = [
  fileURLToPath(new URL("../test/fixtures/characterization/", import.meta.url)),
  fileURLToPath(new URL("../implementation_evidence/", import.meta.url)),
];
const forbidden = [
  /\/api\/(?!<redacted>|TEST_CREDENTIAL)[A-Za-z0-9_-]{8,}/i,
  /(?:username|credential|authorization|token)\s*[:=]\s*["'][^<][^"']{6,}["']/i,
];

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else result.push(path);
  }
  return result;
}

const violations = [];
for (const root of roots) {
  let rootFiles;
  try {
    rootFiles = await files(root);
  } catch (error) {
    if (error?.code === "ENOENT") continue;
    throw error;
  }
  for (const file of rootFiles) {
    const content = await readFile(file, "utf8");
    for (const pattern of forbidden) {
      if (pattern.test(content)) violations.push(`${file}: ${pattern}`);
    }
  }
}
if (violations.length > 0) {
  console.error("Characterization secret scan failed:");
  console.error(violations.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Characterization fixture secret scan passed.");
}

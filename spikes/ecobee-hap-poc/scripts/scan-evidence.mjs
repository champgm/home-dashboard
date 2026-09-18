import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const evidence = join(root, '../../implementation_evidence/ecobee-hap-poc');
const patterns = [
  ['setup-code', /\b\d{3}-\d{2}-\d{3}\b/],
  ['ipv4-address', /\b(?:\d{1,3}\.){3}\d{1,3}\b/],
  ['mac-address', /\b(?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2}\b/i],
  ['secret-field', /\b(?:setupCode|privateKey|longTermSecretKey|sessionKey|pairingRecord|encryptedData)\b/i],
  ['long-hex-secret', /\b[0-9a-f]{64,}\b/i]
];

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(path));
    else if (/\.(md|json|log|txt|yaml|yml)$/i.test(entry.name)) output.push(path);
  }
  return output;
}

const files = await walk(evidence);
const findings = [];
for (const path of files) {
  const text = await readFile(path, 'utf8');
  text.split(/\r?\n/).forEach((line, index) => {
    for (const [kind, pattern] of patterns) {
      if (pattern.test(line)) findings.push(`${kind}:${path}:${index + 1}`);
      pattern.lastIndex = 0;
    }
  });
}
if (findings.length) {
  console.error(findings.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`scanned=${files.length} findings=0`);
}

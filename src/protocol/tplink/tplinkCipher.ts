export function utf8Encode(value: string): Uint8Array {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value);
  }
  const bytes: number[] = [];
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
  }
  return new Uint8Array(bytes);
}

export function utf8Decode(value: Uint8Array): string {
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder().decode(value);
  }
  return Array.from(value).map((byte) => String.fromCharCode(byte)).join("");
}

export function encryptTpLink(value: Uint8Array | string): Uint8Array {
  const input = typeof value === "string" ? utf8Encode(value) : value;
  const output = new Uint8Array(input.length);
  let key = 171;
  input.forEach((byte, index) => {
    const encrypted = byte ^ key;
    output[index] = encrypted;
    key = encrypted;
  });
  return output;
}

export function decryptTpLink(value: Uint8Array): Uint8Array {
  const output = new Uint8Array(value.length);
  let key = 171;
  value.forEach((encrypted, index) => {
    output[index] = encrypted ^ key;
    key = encrypted;
  });
  return output;
}

export function encryptJson(value: Record<string, unknown>): Uint8Array {
  return encryptTpLink(JSON.stringify(value));
}

export function decryptJson(value: Uint8Array): Record<string, unknown> {
  const decoded = JSON.parse(utf8Decode(decryptTpLink(value))) as unknown;
  if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
    throw new Error("TP-Link response is not a JSON object.");
  }
  return decoded as Record<string, unknown>;
}

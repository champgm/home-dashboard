import { strict as assert } from "node:assert";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  formatSensorInventory,
  normalizeBridgeUrl,
  readHueAggregate,
  sanitizeHueAggregate,
  sensorInventory,
  writeSnapshot,
} from "../../scripts/capture-hue-snapshot.mjs";

function aggregate() {
  return {
    lights: { "1": { name: "Lamp" } },
    groups: {},
    scenes: {},
    sensors: {
      "10": { name: "Motion", type: "ZLLPresence", manufacturername: "Acme", modelid: "M-1", state: { presence: false } },
      "2": { name: "Dimmer", type: "ZLLSwitch", manufacturername: "Acme", modelid: "D-1", state: { buttonevent: 1002 } },
    },
    rules: {
      "3": {
        owner: "LIVE_TOKEN",
        conditions: [{ address: "/api/LIVE_TOKEN/sensors/2/state/buttonevent" }],
        actions: [{ address: "/api/LIVE_TOKEN/lights/1/state" }],
      },
    },
    schedules: {},
    resourcelinks: {},
    config: { bridgeid: "bridge", whitelist: { LIVE_TOKEN: { name: "operator" } } },
    capabilities: { sensors: { available: 62 } },
    unsupportedRoot: { credential: "LIVE_TOKEN" },
  };
}

test("sanitizes a coherent aggregate without discarding characterization fields", () => {
  const snapshot = sanitizeHueAggregate(aggregate());
  assert.equal(snapshot.sensors["2"].state.buttonevent, 1002);
  assert.equal(snapshot.sensors["2"].modelid, "D-1");
  assert.equal(snapshot.rules["3"].owner, "<redacted>");
  assert.equal(snapshot.rules["3"].conditions[0].address, "/api/<redacted>/sensors/2/state/buttonevent");
  assert.equal(snapshot.config.whitelist, "<redacted>");
  assert.equal(snapshot.unsupportedRoot, undefined);
  assert.equal(JSON.stringify(snapshot).includes("LIVE_TOKEN"), false);
});

test("rejects incomplete aggregate data instead of writing an empty authentication error", () => {
  assert.throws(() => sanitizeHueAggregate({ errors: [{ description: "unauthorized user" }] }), /missing the lights collection/);
});

test("reads the authenticated Hue root once with GET and never returns its credential", async () => {
  let requestUrl;
  let requestOptions;
  const snapshot = await readHueAggregate("192.0.2.4", "token with spaces", async (url, options) => {
    requestUrl = url;
    requestOptions = options;
    return { ok: true, status: 200, json: async () => aggregate() };
  });
  assert.equal(requestUrl, "http://192.0.2.4/api/token%20with%20spaces");
  assert.deepEqual(requestOptions, { method: "GET" });
  assert.equal(JSON.stringify(snapshot).includes("token with spaces"), false);
});

test("reports only a safe network code when the credential-bearing request fails", async () => {
  const transportError = new Error("request containing SECRET_TOKEN failed", { cause: { code: "ECONNREFUSED" } });
  await assert.rejects(
    readHueAggregate("192.0.2.4", "SECRET_TOKEN", async () => { throw transportError; }),
    (error) => error.message === "Hue snapshot read failed before a response was received (ECONNREFUSED)."
      && !error.message.includes("SECRET_TOKEN"),
  );
});

test("normalizes bridge IPs and rejects embedded credentials", () => {
  assert.equal(normalizeBridgeUrl("192.0.2.4\n"), "http://192.0.2.4");
  assert.equal(normalizeBridgeUrl("https://bridge.local/"), "https://bridge.local");
  assert.throws(() => normalizeBridgeUrl("http://user:pass@bridge.local"), /without embedded credentials/);
});

test("lists Sensors in numeric ID order with event discovery fields", () => {
  const snapshot = sanitizeHueAggregate(aggregate());
  assert.deepEqual(sensorInventory(snapshot).map((row) => row.id), ["2", "10"]);
  const output = formatSensorInventory(snapshot);
  assert.match(output, /ID\s+Name\s+Type/);
  assert.match(output, /2\s+Dimmer\s+ZLLSwitch\s+Acme\s+D-1\s+1002/);
});

test("writes private output and refuses accidental replacement", async () => {
  const directory = await mkdtemp(join(tmpdir(), "hue-snapshot-test-"));
  const output = join(directory, "nested", "snapshot.json");
  try {
    await writeSnapshot(output, sanitizeHueAggregate(aggregate()));
    assert.equal((await stat(output)).mode & 0o777, 0o600);
    assert.equal(JSON.parse(await readFile(output, "utf8")).sensors["2"].modelid, "D-1");
    await assert.rejects(writeSnapshot(output, sanitizeHueAggregate(aggregate())), /already exists/);
    await writeSnapshot(output, { replaced: true }, true);
    assert.deepEqual(JSON.parse(await readFile(output, "utf8")), { replaced: true });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

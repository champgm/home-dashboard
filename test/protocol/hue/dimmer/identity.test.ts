import { HueSnapshot } from "../../../../src/app/types";
import {
  matchingCatalogEntries,
  resolveDimmerIdentity,
  sensorsForPhysicalDevice,
} from "../../../../src/protocol/hue/dimmer";

const snapshot: HueSnapshot = {
  lights: {}, groups: {}, scenes: {}, rules: {}, schedules: {}, resourcelinks: {},
  sensors: {
    "4": { name: "Wall switch", type: "ZLLSwitch", manufacturername: "Acme", modelid: "DIM-1", uniqueid: "physical-a" },
    "5": { name: "Wall switch", type: "ZLLSwitch", manufacturername: "Acme", modelid: "DIM-1", uniqueid: "physical-a" },
    "6": { name: "Wall switch", type: "ZLLSwitch", manufacturername: "Acme", modelid: "DIM-2", uniqueid: "physical-b" },
  },
};

const catalog = {
  models: [{
    id: "acme-dimmer",
    label: "Acme four-control dimmer",
    manufacturerNames: ["Acme"],
    modelIds: ["DIM-1"],
    sensorTypes: ["ZLLSwitch"],
    controls: [],
    identityKey: (sensor: { uniqueid?: string }) => sensor.uniqueid,
  }],
};

test("uses catalog identity metadata and does not merge same-name devices", () => {
  const first = resolveDimmerIdentity({ kind: "sensor", id: "4" }, snapshot, catalog);
  const second = resolveDimmerIdentity({ kind: "sensor", id: "5" }, snapshot, catalog);
  expect(first.status).toBe("recognized");
  expect(first.deviceKey).toBe(second.deviceKey);
  expect(sensorsForPhysicalDevice(snapshot, catalog.models[0], first.deviceKey)).toHaveLength(2);
  expect(resolveDimmerIdentity({ kind: "sensor", id: "6" }, snapshot, catalog).status).toBe("unsupported");
});

test("does not guess when catalog identity matching is ambiguous", () => {
  const ambiguous = {
    models: [
      { ...catalog.models[0], id: "one" },
      { ...catalog.models[0], id: "two" },
    ],
  };
  expect(matchingCatalogEntries(snapshot.sensors["4"] as any, ambiguous)).toHaveLength(2);
  expect(resolveDimmerIdentity({ kind: "sensor", id: "4" }, snapshot, ambiguous).status).toBe("ambiguous");
});


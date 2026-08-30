import { ApplicationService } from "../../src/app/ApplicationService";
import { DeviceStateStore } from "../../src/app/DeviceStateStore";
import { HueSnapshot } from "../../src/app/types";

const emptyCollections = {
  lights: {},
  groups: {},
  scenes: {},
  sensors: {},
  rules: {},
  resourcelinks: {},
};

test("normalizes raw Hue Schedule entries before publishing them to the state store", async () => {
  const snapshot: HueSnapshot = {
    ...emptyCollections,
    schedules: {
      "7": {
        name: "Raw morning schedule",
        localtime: "T07:30:00",
        recurring: false,
        command: { address: "/api/bridge-user/lights/1/state", method: "PUT", body: { bri: 80 } },
      },
    },
  };
  const stateStore = new DeviceStateStore();
  const service = new ApplicationService({
    stateStore,
    hue: { snapshot: async () => snapshot },
  });

  await service.refreshHue();

  expect(stateStore.getValue<Record<string, unknown>>({ kind: "schedule", id: "7" })).toMatchObject({
    id: "7",
    timePattern: { kind: "at", localtime: "T07:30:00" },
    command: { method: "PUT", resourceKind: "light", resourceId: "1", subpath: "state", body: { bri: 80 } },
  });
});

test("keeps already-structured Schedule commands structured during snapshot normalization", async () => {
  const snapshot: HueSnapshot = {
    ...emptyCollections,
    schedules: {
      "8": {
        name: "Structured schedule",
        timePattern: { kind: "at", localtime: "T08:00:00" },
        command: { method: "PUT", resourceKind: "light", resourceId: "1", subpath: "state", body: { on: true } },
      },
    },
  };
  const stateStore = new DeviceStateStore();
  const service = new ApplicationService({
    stateStore,
    hue: { snapshot: async () => snapshot },
  });

  await service.refreshHue();

  expect(stateStore.getValue<Record<string, unknown>>({ kind: "schedule", id: "8" })?.command).toEqual({
    method: "PUT",
    resourceKind: "light",
    resourceId: "1",
    subpath: "state",
    body: { on: true },
  });
});

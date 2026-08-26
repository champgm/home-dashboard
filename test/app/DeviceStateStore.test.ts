import { DeviceStateStore } from "../../src/app/DeviceStateStore";

describe("DeviceStateStore last-known presentation data", () => {
  test("retains the last known value without treating an Unknown resource as current", () => {
    const store = new DeviceStateStore();
    const ref = { kind: "plug" as const, plugEndpointId: "bedroom" };
    store.setKnown(ref, { alias: "Bedroom plug", relayState: true });
    store.setUnknown(ref, { category: "NetworkUnavailable", message: "offline" });

    expect(store.get(ref)?.state.status).toBe("unknown");
    expect(store.get(ref)?.lastKnownValue).toEqual({ alias: "Bedroom plug", relayState: true });
    expect(store.getValue(ref)).toBeUndefined();
  });
});

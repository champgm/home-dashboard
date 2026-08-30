import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

const states: Record<string, unknown> = {
  "light:1": { name: "Lamp", type: "Extended color light", modelid: "LCT", state: { on: true, bri: 100, hue: 20, sat: 80, xy: [0.4, 0.5], ct: 300, reachable: true }, capabilities: { control: { bri: true, hue: true, sat: true, xy: true, ct: { min: 153, max: 500 }, alert: true, effect: true } } },
  "light:2": { name: "Guest Lamp", type: "Dimmable light", modelid: "LWB", state: { on: false, bri: 80, reachable: true }, capabilities: { control: { bri: true } } },
  "group:2": { name: "Room", lights: ["1", "3"], class: "Living room", type: "Room", action: { on: true, bri: 120, xy: [0.4, 0.5] } },
  "scene:3": { name: "Evening", type: "LightScene", lights: ["1"], lightstates: { "1": { on: true, bri: 90 } }, appdata: { version: 1 }, owner: "owner", locked: false, version: 2 },
  "scene:bdATgVKQdaELH9I": { name: "Household Group Scene", type: "GroupScene", group: "3" },
  "scene:other-group": { name: "Other Group Scene", type: "GroupScene", group: "4" },
  "scene:rich-state": { name: "Rich state", type: "LightScene", lights: ["1"], lightstates: { "1": { on: true, bri: 90, hue: 123, sat: 45, xy: [0.4, 0.5], ct: 250, transitiontime: 4 } } },
  "sensor:4": { name: "Dimmer", type: "ZLLSwitch", manufacturername: "Signify", modelid: "RWL", uniqueid: "00:11", config: { on: true, battery: 80 }, state: { buttonevent: 1002 }, capabilities: { inputs: ["buttonevent"] } },
  "rule:5": { name: "Dimmer on", conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1002" }], actions: [{ address: "/lights/1/state", method: "PUT", body: { on: true } }], status: "disabled" },
  "rule:group-scene": { name: "Activate household scene", conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1002" }], actions: [{ address: "/groups/3/action", method: "PUT", body: { scene: "bdATgVKQdaELH9I" } }], status: "disabled" },
  "rule:rich": { name: "Dimmer fade", conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1002" }], actions: [{ address: "/lights/1/state", method: "PUT", body: { bri: 180, transitiontime: 4 } }], status: "disabled" },
  "rule:broken": { name: "Broken dimmer", conditions: [{ address: "/sensors/4/state/not-a-real-event", operator: "eq", value: "1002" }], actions: [{ address: "/lights/1/action", method: "PUT", body: { on: true } }], status: "disabled" },
  "rule:trailing-path": { name: "Malformed paths", conditions: [{ address: "/sensors/4/state/buttonevent/extra", operator: "eq", value: "1002" }], actions: [{ address: "/lights/1/state/extra", method: "PUT", body: { on: true } }], status: "disabled" },
  "schedule:6": { name: "Morning", description: "Start day", timePattern: { kind: "at", localtime: "T07:00:00" }, command: { method: "PUT", resourceKind: "light", resourceId: "1", subpath: "state", body: { on: true } }, autodelete: false },
  "schedule:brightness": { name: "Dim at night", description: "Dim without toggling", timePattern: { kind: "at", localtime: "T22:00:00" }, command: { method: "PUT", resourceKind: "light", resourceId: "1", subpath: "state", body: { bri: 80, transitiontime: 4 }, authorizationCredential: "old-user" }, autodelete: false },
  "schedule:recurring-timer": { name: "Repeat timer", description: "Repeat every five minutes", timePattern: { kind: "timer", time: "PT00:05:00", recurring: true }, command: { method: "PUT", resourceKind: "light", resourceId: "1", subpath: "state", body: { on: true }, authorizationCredential: "old-user" }, autodelete: false },
  "schedule:recurring-daily": { name: "Daily timer", description: "Daily with a start date", timePattern: { kind: "recurring-daily", localtime: "T07:00:00", recurring: true, date: "2026-01-01T07:00:00" }, command: { method: "PUT", resourceKind: "light", resourceId: "1", subpath: "state", body: { on: true }, authorizationCredential: "old-user" }, autodelete: false },
  "schedule:unsupported": { name: "Custom command", description: "Unsupported command", timePattern: { kind: "at", localtime: "T08:00:00" }, command: { method: "POST", resourceKind: "custom", resourceId: "abc", subpath: "action", body: { custom: true } }, autodelete: false },
  "schedule:unsupported-time": { name: "Unsupported timing", description: "Needs a replacement", timePattern: { kind: "at", localtime: "T00:00:00" }, timePatternRaw: { kind: "holiday", value: "next-weekend" }, command: { method: "PUT", resourceKind: "light", resourceId: "1", subpath: "state", body: { on: true } }, autodelete: false },
  "resourcelink:7": { class: "HomeDashboard", description: "Favorites", links: ["/lights/1"] },
  "resourcelink:scene": { class: "HomeDashboard", description: "Household scene", links: ["/scenes/bdATgVKQdaELH9I"] },
  "plug:hs103": { alias: "Hallway Plug", model: "HS103", deviceId: "TEST-HS103-ID", hardwareVersion: "2.0", softwareVersion: "1.0.8", mac: "00:11:22:33:44:66", rssi: -52, signalLevel: 2, relayState: false, feature: "TIM", hasEnergy: false },
};

const stateStore = {
  get: jest.fn((ref: { kind: string; id?: string; plugEndpointId?: string }) => {
    const value = states[`${ref.kind}:${ref.kind === "plug" ? ref.plugEndpointId : ref.id}`];
    return value === undefined ? undefined : { state: { status: "known", value }, pending: false };
  }),
  getAll: jest.fn(() => new Map(Object.entries(states).map(([key, value]) => [key, { state: { status: "known", value }, pending: false }]))),
};
const configStore = { getCommitted: jest.fn(() => ({ bridge: {}, plugs: [], favorites: [] })) };
const mockRuntime = {
  service: {
    stateStore,
    setAbsolute: jest.fn(async () => ({ kind: "success" as const })),
    mutateHue: jest.fn(async () => ({ kind: "success" as const })),
    createHue: jest.fn(async () => ({ kind: "success" as const })),
    deleteHue: jest.fn(async () => ({ kind: "success" as const })),
    mutateSceneLightState: jest.fn(async () => ({ kind: "success" as const })),
    performPrimary: jest.fn(async () => ({ kind: "success" as const })),
    rebuildScheduleCommand: jest.fn(async () => ({ kind: "success" as const })),
    setPlugAlias: jest.fn(async () => ({ kind: "success" as const })),
  },
  configStore,
};

jest.mock("../../../src/ui/AppContext", () => ({ useAppRuntime: () => mockRuntime }));

import { GroupEditor } from "../../../src/ui/editors/GroupEditor";
import { LightEditor } from "../../../src/ui/editors/LightEditor";
import { ResourceLinkEditor } from "../../../src/ui/editors/ResourceLinkEditor";
import { RuleEditor } from "../../../src/ui/editors/RuleEditor";
import { SceneEditor } from "../../../src/ui/editors/SceneEditor";
import { ScheduleEditor } from "../../../src/ui/editors/ScheduleEditor";
import { SensorEditor } from "../../../src/ui/editors/SensorEditor";
import { PlugEditor } from "../../../src/ui/editors/PlugEditor";

describe("typed management editors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("exposes resource-specific fields and keeps inspection data read-only", () => {
    const light = render(<LightEditor route={{ params: { id: "1" } }} />);
    expect(light.getByTestId("light-bri")).toBeTruthy();
    expect(light.getByTestId("light-bri-slider")).toBeTruthy();
    expect(light.getByTestId("light-hue")).toBeTruthy();
    expect(light.getByLabelText("Hue color picker")).toBeTruthy();
    expect(light.getByTestId("light-xy")).toBeTruthy();
    expect(light.getByLabelText("XY color picker")).toBeTruthy();
    light.unmount();

    const group = render(<GroupEditor route={{ params: { id: "2" } }} />);
    expect(group.getByTestId("group-lights")).toBeTruthy();
    fireEvent.press(group.getByTestId("group-lights-selector"));
    expect(group.getByLabelText("Lights: Lamp").props.accessibilityState.selected).toBe(true);
    expect(group.getByLabelText("Lights: Guest Lamp").props.accessibilityState.selected).toBe(false);
    expect(group.getByLabelText("Lights: Unavailable light (ID 3)").props.accessibilityState.selected).toBe(true);
    expect(group.getByTestId("group-action-bri")).toBeTruthy();
    expect(group.getByTestId("group-action-xy")).toBeTruthy();
    expect(group.getByText("Aggregate state")).toBeTruthy();
    group.unmount();

    const scene = render(<SceneEditor route={{ params: { id: "3" } }} />);
    expect(scene.getByText("Scene type")).toBeTruthy();
    expect(scene.getByTestId("scene-save-lightstates")).toBeTruthy();
    expect(scene.getByTestId("scene-activate")).toBeTruthy();
    scene.unmount();

    const sensor = render(<SensorEditor route={{ params: { id: "4" } }} />);
    expect(sensor.getByTestId("sensor-config-on")).toBeTruthy();
    expect(sensor.getByText("Button event")).toBeTruthy();
    sensor.unmount();

    const rule = render(<RuleEditor route={{ params: { id: "5" } }} />);
    fireEvent.press(rule.getByTestId("rule-condition-0-summary"));
    fireEvent.press(rule.getByTestId("rule-action-0-summary"));
    expect(rule.getByTestId("rule-condition-0-sensor")).toBeTruthy();
    expect(rule.getByTestId("rule-action-0-target")).toBeTruthy();
    rule.unmount();

    const schedule = render(<ScheduleEditor route={{ params: { id: "6" } }} />);
    fireEvent.press(schedule.getByTestId("schedule-time-summary"));
    fireEvent.press(schedule.getByTestId("schedule-command-summary"));
    expect(schedule.getByTestId("schedule-pattern")).toBeTruthy();
    expect(schedule.getByTestId("schedule-target-kind")).toBeTruthy();
    schedule.unmount();

    const resourceLink = render(<ResourceLinkEditor route={{ params: { id: "7" } }} />);
    expect(resourceLink.getByTestId("resourcelink-kind")).toBeTruthy();
    expect(resourceLink.queryByTestId("resourcelink-path")).toBeNull();
    resourceLink.unmount();

    configStore.getCommitted.mockReturnValue({ bridge: {}, plugs: [{ id: "hs103", ipv4: "192.168.1.30", port: 9999 }], favorites: [] } as any);
    const plug = render(<PlugEditor route={{ params: { id: "hs103" } }} />);
    expect(plug.getByLabelText("Model: HS103")).toBeTruthy();
    expect(plug.getByLabelText("MAC: 00:11:22:33:44:66")).toBeTruthy();
    expect(plug.getByLabelText("Energy: Not reported by this plug")).toBeTruthy();
    plug.unmount();
  });

  test("creates a Group with selected current lights and class", async () => {
    const view = render(<GroupEditor route={{ params: {} }} />);
    fireEvent.changeText(view.getByPlaceholderText("Resource name"), "Guest Room");
    fireEvent.press(view.getByTestId("group-lights-selector"));
    fireEvent.press(view.getByLabelText("Lights: Lamp"));
    fireEvent.press(view.getByLabelText("Lights: Guest Lamp"));
    fireEvent.press(view.getByText("Guest room"));
    fireEvent.press(view.getByTestId("editor-save"));

    await waitFor(() => expect(mockRuntime.service.createHue).toHaveBeenCalledWith("group", {
      name: "Guest Room",
      lights: ["1", "2"],
      type: "Room",
      class: "Guest room",
    }));
  });

  test("updates Group membership without silently dropping an unavailable selected light", async () => {
    const view = render(<GroupEditor route={{ params: { id: "2" } }} />);
    fireEvent.press(view.getByTestId("group-lights-selector"));
    fireEvent.press(view.getByLabelText("Lights: Guest Lamp"));
    fireEvent.press(view.getByTestId("editor-save"));

    await waitFor(() => expect(mockRuntime.service.mutateHue).toHaveBeenCalledWith(
      "group",
      "2",
      "update",
      expect.objectContaining({ lights: ["1", "3", "2"] }),
    ));
  });

  test("lists editable item fields before inspection-only details", () => {
    const light = render(<LightEditor route={{ params: { id: "1" } }} />);
    const rendered = JSON.stringify(light.toJSON());
    expect(rendered.indexOf('"testID":"light-bri"')).toBeGreaterThanOrEqual(0);
    expect(rendered.indexOf('"accessibilityLabel":"Type: Extended color light"')).toBeGreaterThanOrEqual(0);
    expect(rendered.indexOf('"testID":"light-bri"')).toBeLessThan(rendered.indexOf('"accessibilityLabel":"Type: Extended color light"'));
  });

  test("saves structured rule controls through the service boundary", async () => {
    const view = render(<RuleEditor route={{ params: { id: "5" } }} />);
    fireEvent.press(view.getByTestId("editor-save"));
    await waitFor(() => expect(mockRuntime.service.mutateHue).toHaveBeenCalledWith(
      "rule",
      "5",
      "update",
      expect.objectContaining({
        conditions: [{ address: "/sensors/4/state/buttonevent", operator: "eq", value: "1002" }],
        actions: [{ address: "/lights/1/state", method: "PUT", body: { on: true } }],
      }),
    ));
  });

  test("round-trips GroupScene actions and alphanumeric Scene Resource Links", async () => {
    const rule = render(<RuleEditor route={{ params: { id: "group-scene" } }} />);
    expect(rule.getByTestId("rule-action-0-summary")).toHaveTextContent(/Household Group Scene \(ID bdATgVKQdaELH9I\)/);
    fireEvent.press(rule.getByTestId("rule-action-0-summary"));
    expect(rule.getByLabelText("Scene type: GroupScene").props.accessibilityState.selected).toBe(true);
    expect(rule.getByTestId("rule-action-0-scene-group").props.value).toBe("3");
    fireEvent.press(rule.getByTestId("editor-save"));
    await waitFor(() => expect(mockRuntime.service.mutateHue).toHaveBeenCalledWith(
      "rule",
      "group-scene",
      "update",
      expect.objectContaining({
        actions: [{ address: "/groups/3/action", method: "PUT", body: { scene: "bdATgVKQdaELH9I" } }],
      }),
    ));
    rule.unmount();

    const resourceLink = render(<ResourceLinkEditor route={{ params: { id: "scene" } }} />);
    expect(resourceLink.getByText("Household Group Scene (Scene bdATgVKQdaELH9I)")).toBeTruthy();
    fireEvent.press(resourceLink.getByTestId("resourcelink-save"));
    await waitFor(() => expect(mockRuntime.service.mutateHue).toHaveBeenCalledWith(
      "resourcelink",
      "scene",
      "update",
      expect.objectContaining({ links: ["/scenes/bdATgVKQdaELH9I"] }),
    ));
  });

  test("re-derives a GroupScene owner when its Scene ID changes", async () => {
    const view = render(<RuleEditor route={{ params: { id: "group-scene" } }} />);
    fireEvent.press(view.getByTestId("rule-action-0-summary"));
    fireEvent.changeText(view.getByTestId("rule-action-0-id"), "other-group");
    expect(view.getByLabelText("Scene type: GroupScene").props.accessibilityState.selected).toBe(true);
    expect(view.getByTestId("rule-action-0-scene-group").props.value).toBe("4");
    expect(view.getByLabelText("Exact Scene action path: /groups/4/action")).toBeTruthy();
    fireEvent.press(view.getByTestId("editor-save"));

    await waitFor(() => expect(mockRuntime.service.mutateHue).toHaveBeenCalledWith(
      "rule",
      "group-scene",
      "update",
      expect.objectContaining({
        actions: [{ address: "/groups/4/action", method: "PUT", body: { scene: "other-group" } }],
      }),
    ));
  });

  test("summarizes the complete Scene light state with protocol units", () => {
    const view = render(<SceneEditor route={{ params: { id: "rich-state" } }} />);
    const summary = view.getByTestId("scene-light-1-summary");
    expect(summary).toHaveTextContent(/Brightness 90\/254/);
    expect(summary).toHaveTextContent(/Hue 123\/65535/);
    expect(summary).toHaveTextContent(/Saturation 45\/254/);
    expect(summary).toHaveTextContent(/XY 0\.4,0\.5/);
    expect(summary).toHaveTextContent(/Color temperature 250/);
    expect(summary).toHaveTextContent(/Transition 4/);
  });

  test("does not offer a save action for an Unknown existing Hue resource", () => {
    stateStore.get.mockReturnValueOnce({ state: { status: "unknown", reason: { category: "NetworkUnavailable", message: "offline" } }, pending: false } as any);
    const view = render(<LightEditor route={{ params: { id: "unknown" } }} />);
    expect(view.getByTestId("editor-unknown-resource")).toBeTruthy();
    expect(view.queryByTestId("editor-save")).toBeNull();
    expect(mockRuntime.service.mutateHue).not.toHaveBeenCalled();
  });

  test("does not offer the standalone Resource Link save path when state is Unknown", () => {
    stateStore.get.mockReturnValueOnce({ state: { status: "unknown", reason: { category: "NetworkUnavailable", message: "offline" } }, pending: false } as any);
    const view = render(<ResourceLinkEditor route={{ params: { id: "unknown-link" } }} />);
    expect(view.queryByTestId("resourcelink-save")).toBeNull();
    expect(view.queryByTestId("resourcelink-add")).toBeNull();
  });

  test("renders richer Rule action bodies and provides repair/remove controls", () => {
    const rich = render(<RuleEditor route={{ params: { id: "rich" } }} />);
    fireEvent.press(rich.getByTestId("rule-action-0-summary"));
    expect(rich.getByTestId("rule-action-0-bri")).toBeTruthy();
    expect(rich.queryByTestId("rule-action-0-bri-exact")).toBeNull();
    expect(rich.getByTestId("rule-action-0-bri-exact-toggle")).toBeTruthy();
    expect(rich.getByTestId("rule-action-0-transitiontime")).toBeTruthy();
    rich.unmount();

    const broken = render(<RuleEditor route={{ params: { id: "broken" } }} />);
    fireEvent.press(broken.getByTestId("rule-condition-0-summary"));
    fireEvent.press(broken.getByTestId("rule-action-0-summary"));
    expect(broken.getByTestId("rule-condition-0-replace")).toBeTruthy();
    expect(broken.getByTestId("rule-action-0-replace")).toBeTruthy();
    fireEvent.press(broken.getByTestId("rule-condition-0-replace"));
    expect(broken.getByTestId("rule-condition-0-sensor")).toBeTruthy();
    fireEvent.press(broken.getByTestId("rule-action-0-replace"));
    expect(broken.getByTestId("rule-action-0-id")).toBeTruthy();
    fireEvent.press(broken.getByTestId("rule-action-0-remove"));
    expect(broken.getByText("No actions. Add one before saving.")).toBeTruthy();
  });

  test.each([
    ["condition", "rule-condition-0-replace", "rule-condition-0-sensor"],
    ["action", "rule-action-0-replace", "rule-action-0-id"],
  ])("requires explicit replacement for a Rule %s with trailing path components", (_case, replacementTestId, editableTestId) => {
    const view = render(<RuleEditor route={{ params: { id: "trailing-path" } }} />);

    fireEvent.press(view.getByTestId(`${replacementTestId.replace("-replace", "-summary")}`));
    expect(view.getByTestId(replacementTestId)).toBeTruthy();
    expect(view.queryByTestId(editableTestId)).toBeNull();
  });

  test("previews changed Rule fields before save", () => {
    const view = render(<RuleEditor route={{ params: { id: "5" } }} />);
    fireEvent.press(view.getByTestId("rule-preview"));
    expect(view.getByText("{}" )).toBeTruthy();
  });

  test("renders weekday and randomization controls for typed Schedule patterns", () => {
    const view = render(<ScheduleEditor route={{ params: { id: "6" } }} />);
    fireEvent.press(view.getByTestId("schedule-time-summary"));
    fireEvent.press(view.getByTestId("schedule-pattern-selector"));
    fireEvent.press(view.getByText("recurring-weekly"));
    expect(view.getByTestId("schedule-weekday-monday")).toBeTruthy();
    fireEvent.press(view.getByText("randomized"));
    expect(view.getByTestId("schedule-random-seconds")).toBeTruthy();
  });

  test("preserves a documented brightness Schedule command on an ordinary save", async () => {
    const view = render(<ScheduleEditor route={{ params: { id: "brightness" } }} />);

    fireEvent.press(view.getByTestId("editor-save"));

    await waitFor(() => expect(mockRuntime.service.mutateHue).toHaveBeenCalledWith(
      "schedule",
      "brightness",
      "update",
      expect.objectContaining({
        command: expect.objectContaining({
          method: "PUT",
          resourceKind: "light",
          resourceId: "1",
          subpath: "state",
          body: { bri: 80, transitiontime: 4 },
        }),
      }),
    ));
  });

  test("edits documented rich Schedule command fields without reducing them to on/off", async () => {
    const view = render(<ScheduleEditor route={{ params: { id: "brightness" } }} />);

    fireEvent.press(view.getByTestId("schedule-command-summary"));
    expect(view.getByTestId("schedule-command-bri")).toBeTruthy();
    expect(view.queryByTestId("schedule-command-bri-exact")).toBeNull();
    fireEvent.press(view.getByTestId("schedule-command-bri-exact-toggle"));
    expect(view.getByTestId("schedule-command-transitiontime")).toBeTruthy();
    fireEvent.changeText(view.getByTestId("schedule-command-bri-exact"), "100");
    fireEvent.press(view.getByTestId("editor-save"));

    await waitFor(() => expect(mockRuntime.service.mutateHue).toHaveBeenCalledWith(
      "schedule",
      "brightness",
      "update",
      expect.objectContaining({
        command: expect.objectContaining({ body: { bri: 100, transitiontime: 4 } }),
      }),
    ));
  });

  test("shows unsupported Schedule commands as read-only instead of fabricating a summary", () => {
    const view = render(<ScheduleEditor route={{ params: { id: "unsupported" } }} />);

    expect(view.getByTestId("schedule-command-summary")).toHaveTextContent(/Unsupported command · read-only/);
    fireEvent.press(view.getByTestId("schedule-command-summary"));
    expect(view.queryByTestId("schedule-target-kind")).toBeNull();
    expect(view.getByText(/not represented by a supported structured form/i)).toBeTruthy();
  });

  test("requires an explicit replacement before saving an unsupported Schedule time pattern", async () => {
    const view = render(<ScheduleEditor route={{ params: { id: "unsupported-time" } }} />);

    expect(view.getByTestId("schedule-time-summary")).toHaveTextContent(/Unsupported time pattern · replace to edit/);
    fireEvent.press(view.getByTestId("schedule-time-summary"));
    expect(view.queryByTestId("schedule-pattern")).toBeNull();
    fireEvent.press(view.getByTestId("schedule-replace-time-pattern"));
    expect(view.getByTestId("schedule-localtime").props.value).toBe("T07:00:00");
    expect(view.getByTestId("schedule-time-summary")).toHaveTextContent(/At · T07:00:00/);
    fireEvent.press(view.getByTestId("editor-save"));

    await waitFor(() => expect(mockRuntime.service.mutateHue).toHaveBeenCalledWith(
      "schedule",
      "unsupported-time",
      "update",
      expect.objectContaining({
        timePattern: { kind: "at", localtime: "T07:00:00" },
      }),
    ));
  });

  test("preserves recurring-timer semantics on an ordinary Schedule save", async () => {
    const view = render(<ScheduleEditor route={{ params: { id: "recurring-timer" } }} />);

    fireEvent.press(view.getByTestId("editor-save"));

    await waitFor(() => expect(mockRuntime.service.mutateHue).toHaveBeenCalledWith(
      "schedule",
      "recurring-timer",
      "update",
      expect.objectContaining({
        timePattern: expect.objectContaining({ kind: "timer", time: "PT00:05:00", recurring: true }),
      }),
    ));
  });

  test("round-trips recurring-daily Schedule start dates through the editor", async () => {
    const view = render(<ScheduleEditor route={{ params: { id: "recurring-daily" } }} />);

    fireEvent.press(view.getByTestId("schedule-time-summary"));
    expect(view.getByTestId("schedule-starttime").props.value).toBe("2026-01-01T07:00:00");
    fireEvent.press(view.getByTestId("editor-save"));

    await waitFor(() => expect(mockRuntime.service.mutateHue).toHaveBeenCalledWith(
      "schedule",
      "recurring-daily",
      "update",
      expect.objectContaining({
        timePattern: expect.objectContaining({ kind: "recurring-daily", localtime: "T07:00:00", recurring: true, date: "2026-01-01T07:00:00" }),
      }),
    ));
  });
});

import { buildSceneActivation, buildSceneLightStateUpdate } from "../../../../src/protocol/hue/resources/scenes";
import { buildScheduleUpdate, parseSchedules } from "../../../../src/protocol/hue/resources/schedules";
import { parseRules } from "../../../../src/protocol/hue/resources/rules";
import { buildLightStateUpdate } from "../../../../src/protocol/hue/resources/lights";
import { groupAggregateState } from "../../../../src/protocol/hue/resources/groups";

describe("Hue resource serializers", () => {
  test("group and scene semantics use absolute action routing", () => {
    expect(groupAggregateState({ id: "1", state: { any_on: true, all_on: false } })).toBe("indeterminate");
    expect(buildSceneActivation({ id: "light", type: "LightScene" })).toEqual({ groupId: "0", payload: { scene: "light" } });
    expect(buildSceneActivation({ id: "group", type: "GroupScene", group: "4" })).toEqual({ groupId: "4", payload: { scene: "group" } });
  });

  test("changed field serializers omit unrelated data", () => {
    expect(buildLightStateUpdate({ on: false, bri: 10 }, { on: true })).toEqual({ on: true });
    expect(buildSceneLightStateUpdate({ on: false, bri: 10 }, { on: false, bri: 20 })).toEqual({ bri: 20 });
    const schedule = parseSchedules({ "1": { name: "Morning", command: { address: "/api/OLD/lights/1/state", method: "PUT", body: { on: true } } } })["1"];
    expect(schedule.command).toEqual(expect.objectContaining({ resourceKind: "light", resourceId: "1", subpath: "state" }));
    expect(buildScheduleUpdate(schedule, { name: "New name" })).toEqual({ name: "New name" });
    expect(buildScheduleUpdate(schedule, { command: schedule.command })).toEqual({});
  });

  test("keeps malformed Rule entries inspectable for structured replacement", () => {
    const rules = parseRules({ "1": { conditions: [{ operator: "eq" }], actions: [{ address: "/lights/1/action" }] } });
    expect(rules["1"].conditions).toEqual([{ address: "", operator: "eq" }]);
    expect(rules["1"].actions).toEqual([{ address: "/lights/1/action", method: "UNKNOWN" }]);
  });

  test("keeps malformed Schedules isolated and inspectable instead of aborting the collection", () => {
    const schedules = parseSchedules({
      malformed: { name: "Needs repair", localtime: "T07:00:00", command: { method: "PUT", body: { on: true } } },
      valid: { name: "Still available", localtime: "T08:00:00", command: { address: "/api/user/lights/1/state", method: "PUT", body: { on: true } } },
    });

    expect(Object.keys(schedules).sort()).toEqual(["malformed", "valid"]);
    expect(schedules.malformed.name).toBe("Needs repair");
    expect(schedules.malformed.command).toEqual(expect.objectContaining({ method: "PUT" }));
    expect(schedules.valid.command).toEqual(expect.objectContaining({ resourceKind: "light", resourceId: "1" }));
  });

  test("retains an unsupported Schedule time pattern beside a safe fallback", () => {
    const schedule = parseSchedules({
      unsupported: { name: "Holiday schedule", localtime: "T09:00:00", timePattern: { kind: "holiday", date: "next-weekend" } },
    }).unsupported;

    expect(schedule.timePattern).toEqual({ kind: "at", localtime: "T09:00:00" });
    expect(schedule.timePatternRaw).toEqual({ kind: "holiday", date: "next-weekend" });
  });

  test("serializes an intentionally changed Schedule command exactly once", () => {
    const original = parseSchedules({
      "1": { command: { address: "/api/OLD/lights/1/state", method: "PUT", body: { on: true } } },
    })["1"];

    expect(buildScheduleUpdate(original, {
      command: { method: "PUT", resourceKind: "light", resourceId: "1", subpath: "state", body: { on: false } },
    })).toEqual({
      command: { address: "/api/<redacted>/lights/1/state", method: "PUT", body: { on: false } },
    });
  });
});

import { buildSceneActivation, buildSceneLightStateUpdate } from "../../../../src/protocol/hue/resources/scenes";
import { buildScheduleUpdate, parseSchedules } from "../../../../src/protocol/hue/resources/schedules";
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
    expect(buildScheduleUpdate(schedule, { name: "New name" })).toEqual({ name: "New name" });
    expect(buildScheduleUpdate(schedule, { command: schedule.command })).toEqual({});
  });
});

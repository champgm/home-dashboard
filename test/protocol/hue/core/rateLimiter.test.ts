import { HueRateLimiter, PacingClock } from "../../../../src/protocol/hue/rateLimiter";

describe("Hue dispatch pacing", () => {
  test("uses dispatch time and separate channels", async () => {
    let now = 0;
    const clock: PacingClock = { now: () => now, sleep: async (ms) => { now += ms; } };
    const limiter = new HueRateLimiter(clock);
    const lightTimes: number[] = [];
    await limiter.dispatch("light-state", async () => { lightTimes.push(now); });
    await limiter.dispatch("light-state", async () => { lightTimes.push(now); });
    expect(lightTimes[1] - lightTimes[0]).toBeGreaterThanOrEqual(100);
    const groupTimes: number[] = [];
    await limiter.dispatch("group-action", async () => { groupTimes.push(now); });
    await limiter.dispatch("group-action", async () => { groupTimes.push(now); });
    expect(groupTimes[1] - groupTimes[0]).toBeGreaterThanOrEqual(1000);
  });
});

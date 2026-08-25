import { legacyButtonAssets } from "../../../src/ui/legacy/legacyButtonAssets";

describe("legacy button assets", () => {
  test("exposes every retained bitmap used by the dashboard contract", () => {
    expect(legacyButtonAssets.edit).toBeDefined();
    expect(legacyButtonAssets.favorite).toBeDefined();
    expect(legacyButtonAssets.questionMark).toBeDefined();
    expect(legacyButtonAssets.lightBulb).toBeDefined();
  });
});

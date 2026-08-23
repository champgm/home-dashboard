import { classifyHueResponse } from "../../../../src/protocol/hue/resultClassifier";
import { redactHueCredential } from "../../../../src/protocol/hue/redaction";

describe("Hue transport response classification", () => {
  test("classifies success, error, and mixed arrays", () => {
    expect(classifyHueResponse([{ success: { address: "/lights/1/state/on" } }]).kind).toBe("success");
    expect(classifyHueResponse([{ error: { type: 1, description: "bad" } }]).kind).toBe("definite_failure");
    expect(classifyHueResponse([{ success: { a: 1 } }, { error: { type: 2 } }]).kind).toBe("partial_failure");
  });

  test("redacts credentials from paths and messages", () => {
    const value = redactHueCredential("http://192.168.1.2/api/SECRET123/lights/1?credential=SECRET123");
    expect(value).not.toContain("SECRET123");
    expect(value).toContain("<redacted>");
  });
});

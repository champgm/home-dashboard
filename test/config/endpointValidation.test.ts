import { isPrivateLocalIpv4, validatePort, validatePrivateIpv4 } from "../../src/config/endpointValidation";

describe("private endpoint validation", () => {
  test.each(["10.0.0.1", "172.16.2.3", "192.168.1.20", "169.254.1.1"])("accepts %s", (value) => {
    expect(isPrivateLocalIpv4(value)).toBe(true);
    expect(validatePrivateIpv4(value).valid).toBe(true);
  });

  test.each(["127.0.0.1", "0.0.0.0", "8.8.8.8", "192.168.1.255", "224.0.0.1", "bridge.local", "10.0.0.999"])("rejects %s", (value) => {
    expect(isPrivateLocalIpv4(value)).toBe(false);
    expect(validatePrivateIpv4(value).valid).toBe(false);
  });

  test("defaults and bounds ports", () => {
    expect(validatePort(undefined)).toBe(9999);
    expect(validatePort("1")).toBe(1);
    expect(validatePort(65535)).toBe(65535);
    expect(() => validatePort(0)).toThrow();
    expect(() => validatePort(65536)).toThrow();
  });
});

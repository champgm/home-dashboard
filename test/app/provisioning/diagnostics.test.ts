import { ApplicationService } from "../../../src/app/ApplicationService";
import { HueProvisioningService } from "../../../src/app/HueProvisioningService";
import { diagnosticForError } from "../../../src/app/diagnostics";
import { HueResponseError } from "../../../src/protocol/hue/HueV1Adapter";
import { HueTransportError } from "../../../src/protocol/hue/httpTransport";
import { ConfigStore, KeyValueStore } from "../../../src/storage/ConfigStore";
import { CredentialStore, ProtectedValueStore } from "../../../src/storage/CredentialStore";

class MemoryKeyValue implements KeyValueStore {
  value: string | null = null;
  async getItem(): Promise<string | null> { return this.value; }
  async setItem(_key: string, value: string): Promise<void> { this.value = value; }
  async removeItem(): Promise<void> { this.value = null; }
}

class MemoryProtected implements ProtectedValueStore {
  value: string | null = null;
  async getItemAsync(): Promise<string | null> { return this.value; }
  async setItemAsync(_key: string, value: string): Promise<void> { this.value = value; }
}

async function provisioningWith(provisionError: unknown, verifyError?: unknown) {
  const config = new ConfigStore(new MemoryKeyValue());
  await config.load();
  const credentials = new CredentialStore(new MemoryProtected());
  const adapter = {
    provision: async () => {
      if (provisionError) throw provisionError;
      return "SECRET_USERNAME";
    },
    getConfigWithCredential: async () => {
      if (verifyError) throw verifyError;
      return { bridgeid: "BRIDGE" };
    },
  };
  const service = new HueProvisioningService(config, credentials, () => adapter as any);
  return service.provision("192.168.1.2");
}

describe("provisioning diagnostics", () => {
  test("preserves a Hue link-button rejection and protocol code", async () => {
    const result = await provisioningWith(new HueResponseError(
      "definite_failure",
      "link button not pressed",
      [{ type: 101, description: "link button not pressed" }],
    ));

    expect(result.diagnostic).toMatchObject({
      category: "ProtocolRejected",
      operation: "Hue link-button provisioning",
      resource: "bridge:192.168.1.2",
      protocolCode: 101,
      detail: "link button not pressed",
    });
  });

  test.each([
    ["NetworkUnavailable", "bridge unreachable"],
    ["Timeout", "Hue request timed out"],
    ["ProtocolMalformed", "Hue returned malformed JSON"],
  ] as const)("keeps the %s category", async (category, detail) => {
    const result = await provisioningWith(new HueTransportError(category, detail, false));
    expect(result.diagnostic).toMatchObject({ category, detail });
  });

  test("keeps verification authentication failures distinct and redacts credentials", async () => {
    const result = await provisioningWith(undefined, new HueTransportError(
      "AuthenticationRejected",
      "GET http://192.168.1.2/api/SECRET_USERNAME/config rejected credential=SECRET_USERNAME",
      false,
      403,
    ));

    expect(result.diagnostic).toMatchObject({ category: "AuthenticationRejected", statusCode: 403 });
    expect(result.diagnostic?.detail).not.toContain("SECRET_USERNAME");
    expect(result.diagnostic?.detail).toContain("<redacted>");
  });

  test("redacts synthetic credential-bearing exception text", () => {
    const result = diagnosticForError(
      new Error("request failed at http://192.168.1.2/api/SECRET_USERNAME/lights"),
      "Hue snapshot",
      "bridge:192.168.1.2",
    );
    expect(result.category).toBe("NetworkUnavailable");
    expect(result.detail).not.toContain("SECRET_USERNAME");
    expect(result.detail).toContain("<redacted>");
  });

  test("the application diagnostic map clears a resolved provisioning entry", () => {
    const service = new ApplicationService();
    service.setDiagnostic("hue:provisioning", { category: "Timeout", message: "failed" });
    expect(service.getDiagnostic("hue:provisioning")).toBeDefined();
    service.clearDiagnostic("hue:provisioning");
    expect(service.getDiagnostic("hue:provisioning")).toBeUndefined();
  });
});

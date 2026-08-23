import { PlugEndpoint } from "../../../../src/app/types";
import { encryptJson } from "../../../../src/protocol/tplink/tplinkCipher";
import { encodeTpLinkFrame } from "../../../../src/protocol/tplink/tplinkFrame";
import { TpLinkLegacyAdapter } from "../../../../src/protocol/tplink/TpLinkLegacyAdapter";
import { TcpTransport } from "../../../../src/protocol/tplink/TcpTransport";

const endpoint: PlugEndpoint = { id: "plug", ipv4: "192.168.1.20", port: 9999 };

function transportFor(response: Record<string, unknown>): TcpTransport {
  return { send: async () => encodeTpLinkFrame(encryptJson(response)) };
}

describe("TP-Link feature adapter", () => {
  test("maps sysinfo, relay, and energy capability", async () => {
    const adapter = new TpLinkLegacyAdapter({ transport: transportFor({ system: { get_sysinfo: { alias: "Desk", model: "HS110", relay_state: 1, feature: "ENE", emeter: { current_ma: 10 } } } }) });
    const info = await adapter.getSysInfo(endpoint);
    expect(info.alias).toBe("Desk");
    expect(info.relayState).toBe(true);
    expect(info.hasEnergy).toBe(true);
  });

  test("unsupported emeter is not an error", async () => {
    const adapter = new TpLinkLegacyAdapter({ transport: transportFor({ emeter: { get_realtime: { err_code: -1 } } }) });
    await expect(adapter.getEnergy(endpoint)).resolves.toBeUndefined();
  });

  test("explicit error is rejected", async () => {
    const adapter = new TpLinkLegacyAdapter({ transport: transportFor({ system: { set_relay_state: { err_code: -1 } } }) });
    await expect(adapter.setPower(endpoint, true)).rejects.toMatchObject({ category: "ProtocolRejected", errCode: -1 });
  });
});

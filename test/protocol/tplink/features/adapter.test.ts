import { PlugEndpoint } from "../../../../src/app/types";
import { decryptJson, encryptJson } from "../../../../src/protocol/tplink/tplinkCipher";
import { decodeTpLinkFrame, encodeTpLinkFrame } from "../../../../src/protocol/tplink/tplinkFrame";
import { TpLinkLegacyAdapter } from "../../../../src/protocol/tplink/TpLinkLegacyAdapter";
import { TcpTransport } from "../../../../src/protocol/tplink/TcpTransport";
import hs103SysInfo from "../../../../test/fixtures/characterization/tplink.hs103.sysinfo.json";

const endpoint: PlugEndpoint = { id: "plug", ipv4: "192.168.1.20", port: 9999 };

function transportFor(response: Record<string, unknown>): TcpTransport {
  return { send: async () => encodeTpLinkFrame(encryptJson(response)) };
}

describe("TP-Link feature adapter", () => {
  test("sends sysinfo in the nested legacy protocol envelope", async () => {
    let request: Record<string, unknown> | undefined;
    const transport: TcpTransport = {
      send: async (_endpoint, frame) => {
        request = decryptJson(decodeTpLinkFrame(frame));
        return encodeTpLinkFrame(encryptJson({
          system: { get_sysinfo: { err_code: 0, alias: "Desk", relay_state: 1 } },
        }));
      },
    };

    await new TpLinkLegacyAdapter({ transport }).getSysInfo(endpoint);

    expect(request).toEqual({ system: { get_sysinfo: {} } });
  });

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

  test("maps the characterized HS103 fixture without inventing energy telemetry", async () => {
    const adapter = new TpLinkLegacyAdapter({ transport: transportFor(hs103SysInfo as Record<string, unknown>) });
    const info = await adapter.getSysInfo(endpoint);
    expect(info).toEqual(expect.objectContaining({ model: "HS103", alias: "Hallway Plug", deviceId: "TEST-HS103-ID", relayState: false, hasEnergy: false }));
    expect(info.energy).toBeUndefined();
  });

  test("explicit error is rejected", async () => {
    const adapter = new TpLinkLegacyAdapter({ transport: transportFor({ system: { set_relay_state: { err_code: -1 } } }) });
    await expect(adapter.setPower(endpoint, true)).rejects.toMatchObject({ category: "ProtocolRejected", errCode: -1 });
  });
});

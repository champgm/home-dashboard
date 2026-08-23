import { PlugEndpoint, PlugEnergy, PlugSysInfo } from "../../app/types";
import { validatePlugEndpoint } from "../../config/endpointValidation";
import { decryptJson, encryptJson } from "./tplinkCipher";
import { decodeTpLinkFrame, encodeTpLinkFrame } from "./tplinkFrame";
import { ReactNativeTcpTransport, TcpTransport, TcpTransportError } from "./TcpTransport";
import { TPLINK_METHODS, command } from "./commands";
import { mapEnergy, mapSysInfo } from "./models";

export class TpLinkProtocolError extends Error {
  readonly category: "NetworkUnavailable" | "Timeout" | "ProtocolRejected" | "ProtocolMalformed" | "Ambiguous";
  readonly errCode?: number;

  constructor(category: "NetworkUnavailable" | "Timeout" | "ProtocolRejected" | "ProtocolMalformed" | "Ambiguous", message: string, errCode?: number) {
    super(message);
    this.name = "TpLinkProtocolError";
    this.category = category;
    this.errCode = errCode;
  }
}

export interface TpLinkAdapterOptions {
  readonly transport?: TcpTransport;
  readonly timeoutMs?: number;
}

export class TpLinkLegacyAdapter {
  private readonly transport: TcpTransport;
  private readonly timeoutMs: number;

  constructor(options: TpLinkAdapterOptions = {}) {
    this.transport = options.transport || new ReactNativeTcpTransport();
    this.timeoutMs = options.timeoutMs || 5000;
  }

  async getSysInfo(endpoint: PlugEndpoint): Promise<PlugSysInfo> {
    const response = await this.request(endpoint, command(TPLINK_METHODS.sysinfo), false);
    const raw = response.system?.get_sysinfo;
    if (!raw || typeof raw !== "object") {
      throw new TpLinkProtocolError("ProtocolMalformed", "TP-Link response did not contain system information.");
    }
    return mapSysInfo(raw as Record<string, unknown>);
  }

  async getPower(endpoint: PlugEndpoint): Promise<boolean> {
    const info = await this.getSysInfo(endpoint);
    if (typeof info.relayState !== "boolean") {
      throw new TpLinkProtocolError("ProtocolMalformed", "TP-Link system information omitted relay state.");
    }
    return info.relayState;
  }

  async setPower(endpoint: PlugEndpoint, on: boolean): Promise<void> {
    await this.request(endpoint, command(TPLINK_METHODS.relay, { state: on ? 1 : 0 }), true);
  }

  async setAlias(endpoint: PlugEndpoint, alias: string): Promise<void> {
    if (!alias.trim()) {
      throw new TpLinkProtocolError("ProtocolRejected", "A plug alias cannot be empty.");
    }
    await this.request(endpoint, command(TPLINK_METHODS.alias, { alias }), true);
  }

  async getEnergy(endpoint: PlugEndpoint): Promise<PlugEnergy | undefined> {
    try {
      const response = await this.request(endpoint, command(TPLINK_METHODS.energy), false);
      const raw = response.emeter?.get_realtime;
      if (!raw || typeof raw !== "object") {
        return undefined;
      }
      return mapEnergy(raw as Record<string, unknown>);
    } catch (error) {
      if (error instanceof TpLinkProtocolError && error.errCode === -1) {
        return undefined;
      }
      throw error;
    }
  }

  private async request(endpoint: PlugEndpoint, body: Record<string, unknown>, writeMayTransmit: boolean): Promise<Record<string, any>> {
    try {
      validatePlugEndpoint(endpoint);
    } catch (error) {
      throw new TpLinkProtocolError("ProtocolRejected", error instanceof Error ? error.message : "Invalid plug endpoint.");
    }
    const encrypted = encryptJson(body);
    const frame = encodeTpLinkFrame(encrypted);
    let responseFrame: Uint8Array;
    try {
      responseFrame = await this.transport.send(endpoint, frame, this.timeoutMs, writeMayTransmit);
    } catch (error) {
      if (error instanceof TcpTransportError) {
        throw new TpLinkProtocolError(
          error.category,
          error.message,
        );
      }
      throw error;
    }
    try {
      const response = decryptJson(decodeTpLinkFrame(responseFrame));
      const errorCode = findErrorCode(response);
      if (errorCode !== undefined && errorCode !== 0) {
        throw new TpLinkProtocolError("ProtocolRejected", "TP-Link rejected the operation.", errorCode);
      }
      if (!hasSuccessEnvelope(response)) {
        throw new TpLinkProtocolError(
          writeMayTransmit ? "Ambiguous" : "ProtocolMalformed",
          "TP-Link response did not contain a success envelope.",
        );
      }
      return response;
    } catch (error) {
      if (error instanceof TpLinkProtocolError) throw error;
      throw new TpLinkProtocolError(
        writeMayTransmit ? "Ambiguous" : "ProtocolMalformed",
        "TP-Link response was malformed.",
      );
    }
  }
}

function findErrorCode(value: Record<string, any>): number | undefined {
  for (const envelope of Object.values(value)) {
    if (!envelope || typeof envelope !== "object") {
      continue;
    }
    if (typeof envelope.err_code === "number") {
      return envelope.err_code;
    }
    const nested = findErrorCode(envelope as Record<string, any>);
    if (nested !== undefined) {
      return nested;
    }
  }
  return undefined;
}

function hasSuccessEnvelope(value: Record<string, any>): boolean {
  return Object.values(value).some((envelope) => envelope && typeof envelope === "object" && (
    Object.prototype.hasOwnProperty.call(envelope, "err_code")
    || Object.keys(envelope).length > 0
  ));
}

import { PlugEnergy, PlugSysInfo } from "../../app/types";

export interface TpLinkEnvelope {
  readonly system?: Record<string, unknown>;
  readonly emeter?: Record<string, unknown>;
  readonly [key: string]: unknown;
}

export function mapSysInfo(raw: Record<string, unknown>): PlugSysInfo {
  const feature = typeof raw.feature === "string" ? raw.feature : undefined;
  const energy = raw.emeter && typeof raw.emeter === "object" ? mapEnergy(raw.emeter as Record<string, unknown>) : undefined;
  return {
    alias: typeof raw.alias === "string" ? raw.alias : undefined,
    model: typeof raw.model === "string" ? raw.model : undefined,
    deviceId: stringValue(raw.deviceId) || stringValue(raw.device_id),
    hardwareVersion: stringValue(raw.hw_ver) || stringValue(raw.hardware_version),
    softwareVersion: stringValue(raw.sw_ver) || stringValue(raw.software_version),
    mac: typeof raw.mac === "string" ? raw.mac : undefined,
    rssi: typeof raw.rssi === "number" ? raw.rssi : undefined,
    signalLevel: typeof raw.signal_level === "number" ? raw.signal_level : undefined,
    relayState: typeof raw.relay_state === "number" ? raw.relay_state === 1 : undefined,
    feature,
    hasEnergy: Boolean(energy) || (typeof feature === "string" && feature.includes("ENE")),
    energy,
    raw,
  };
}

export function mapEnergy(raw: Record<string, unknown>): PlugEnergy {
  return {
    currentMa: numberValue(raw.current_ma),
    voltageMv: numberValue(raw.voltage_mv),
    powerMw: numberValue(raw.power_mw),
    totalWh: numberValue(raw.total_wh),
    todayWh: numberValue(raw.today_energy),
    monthWh: numberValue(raw.month_energy),
  };
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

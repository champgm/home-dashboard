export const TPLINK_METHODS = {
  sysinfo: "system.get_sysinfo",
  relay: "system.set_relay_state",
  alias: "system.set_dev_alias",
  energy: "emeter.get_realtime",
} as const;

export function command(method: string, params: Record<string, unknown> = {}): Record<string, unknown> {
  return { [method]: params };
}

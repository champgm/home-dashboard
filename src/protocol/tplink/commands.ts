export const TPLINK_METHODS = {
  sysinfo: "system.get_sysinfo",
  relay: "system.set_relay_state",
  alias: "system.set_dev_alias",
  energy: "emeter.get_realtime",
} as const;

export function command(method: string, params: Record<string, unknown> = {}): Record<string, unknown> {
  const [module, operation, ...extra] = method.split(".");
  if (!module || !operation || extra.length > 0) {
    throw new Error(`Invalid TP-Link method: ${method}`);
  }
  return { [module]: { [operation]: params } };
}

export enum Alert {
  LSELECT = "lselect",
  NONE = "none",
  SELECT = "select",
}

export function verify(alert: Alert): Alert {
  if (!Object.values(Alert).includes(alert)) {
    throw new Error(`Alert, '${alert}' ` +
      `is not a valid Alert. ` +
      `Valid Alerts: ${JSON.stringify(Alert)}`);
  }
  return alert;
}

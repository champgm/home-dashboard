
const updaters: { [key: string]: () => void } = {};

export function register(key: string, update: () => void): void {
  updaters[key] = update;
}

export function deregister(key: string): void {
  delete updaters[key];
}

export function triggerUpdate() {
  Object.values(updaters).forEach((update) => update());
}

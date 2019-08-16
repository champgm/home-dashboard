
const updaters: { [key: string]: () => void } = {};

export function register(key: string, update: () => void): void {
  updaters[key] = update;
}

export function triggerUpdate() {
  Object.values(updaters).forEach((update) => update());
}

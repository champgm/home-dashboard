
const updaters: [() => void] = [] as any;

export function register(update: () => void): void {
  updaters.push(update);
}

export function triggerUpdate() {
  updaters.forEach((update) => update());
}

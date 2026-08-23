import { Diagnostic, ResourceRef, ResourceState, UnknownResourceState } from "./types";

export interface StoredResourceState<T = unknown> {
  readonly state: ResourceState<T>;
  readonly pending: boolean;
  readonly diagnostic?: Diagnostic;
}

type Listener = () => void;

export class DeviceStateStore {
  private readonly resources = new Map<string, StoredResourceState>();
  private readonly listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  get(ref: ResourceRef): StoredResourceState | undefined {
    return this.resources.get(resourceKey(ref));
  }

  getValue<T>(ref: ResourceRef): T | undefined {
    const stored = this.get(ref);
    return stored?.state.status === "known" ? stored.state.value as T : undefined;
  }

  getAll(): ReadonlyMap<string, StoredResourceState> {
    return this.resources;
  }

  setKnown<T>(ref: ResourceRef, value: T): void {
    const current = this.get(ref);
    this.resources.set(resourceKey(ref), {
      state: { status: "known", value },
      pending: current?.pending || false,
      diagnostic: undefined,
    });
    this.publish();
  }

  setUnknown(ref: ResourceRef, reason: Diagnostic): void {
    const current = this.get(ref);
    const unknown: UnknownResourceState = { status: "unknown", reason };
    this.resources.set(resourceKey(ref), {
      state: unknown,
      pending: current?.pending || false,
      diagnostic: reason,
    });
    this.publish();
  }

  setPending(ref: ResourceRef, pending: boolean): void {
    const current = this.get(ref);
    if (!current) {
      this.resources.set(resourceKey(ref), {
        state: { status: "unknown", reason: { category: "Unknown", message: "State has not been read." } },
        pending,
      });
    } else {
      this.resources.set(resourceKey(ref), { ...current, pending });
    }
    this.publish();
  }

  clearPending(): void {
    let changed = false;
    this.resources.forEach((value, key) => {
      if (value.pending) {
        this.resources.set(key, { ...value, pending: false });
        changed = true;
      }
    });
    if (changed) this.publish();
  }

  remove(ref: ResourceRef): void {
    this.resources.delete(resourceKey(ref));
    this.publish();
  }

  private publish(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export function resourceKey(ref: ResourceRef): string {
  return ref.kind === "plug"
    ? `plug:${ref.plugEndpointId || ref.id || ""}`
    : `${ref.kind}:${ref.id || ""}`;
}

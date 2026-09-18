import type { SecureValueStore } from '../../src/hap/ports/contracts';

export class MemorySecureValueStore implements SecureValueStore {
  readonly values = new Map<string, string>();
  failGet = false;
  failSet = false;
  failDelete = false;

  async get(key: string): Promise<string | null> {
    if (this.failGet) throw new Error('get failed');
    return this.values.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    if (this.failSet) throw new Error('set failed');
    this.values.set(key, value);
  }

  async delete(key: string): Promise<void> {
    if (this.failDelete) throw new Error('delete failed');
    this.values.delete(key);
  }
}

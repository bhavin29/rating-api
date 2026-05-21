export class TtlCache<T> {
  private readonly values = new Map<string, { expiresAt: number; value: T }>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | undefined {
    const cached = this.values.get(key);
    if (!cached) {
      return undefined;
    }

    if (cached.expiresAt <= Date.now()) {
      this.values.delete(key);
      return undefined;
    }

    return cached.value;
  }

  set(key: string, value: T): T {
    this.values.set(key, { expiresAt: Date.now() + this.ttlMs, value });
    return value;
  }

  clear(): void {
    this.values.clear();
  }
}

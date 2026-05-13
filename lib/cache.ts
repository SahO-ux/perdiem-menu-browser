import "server-only";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// Module-level singleton — persists across requests within a single server process.
// Safe for this scope: no DB needed, in-memory is sufficient per the challenge spec.
const store = new Map<string, CacheEntry<unknown>>();

const get = <T>(key: string): T | null => {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
};

const set = <T>(key: string, data: T, ttlMs: number): void => {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
};

export const cache = { get, set };

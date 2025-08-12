import { loadServerEnv } from '@rbac-boilerplate/config';

export type FlagContext = { userId?: number; roles?: string[] };

export interface FlagProvider {
  getFlag(key: string, ctx?: FlagContext): Promise<boolean>;
}

export class FlagsmithProvider implements FlagProvider {
  private readonly env = loadServerEnv();
  private cache = new Map<string, { value: boolean; expiresAt: number }>();
  private ttlMs = 60_000;

  async getFlag(key: string, ctx?: FlagContext): Promise<boolean> {
    void ctx;
    const now = Date.now();
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > now) return cached.value;

    // Placeholder: default false when no provider integrated yet
    const value = false;
    this.cache.set(key, { value, expiresAt: now + this.ttlMs });
    return value;
  }
}

export function createFlagProvider(): FlagProvider {
  return new FlagsmithProvider();
}

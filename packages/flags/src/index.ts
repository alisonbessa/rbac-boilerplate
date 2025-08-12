import { loadServerEnv } from '@rbac-boilerplate/config';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const DEBUG = process.env.FLAGS_DEBUG === 'true';

export type FlagContext = { userId?: number; roles?: string[] };

export type FlagResult = {
  enabled: boolean;
  value?: string | number | boolean | null;
};

export interface FlagProvider {
  getFlag(key: string, ctx?: FlagContext): Promise<FlagResult>;
}

export class FlagsmithProvider implements FlagProvider {
  private readonly env = loadServerEnv();
  private cache = new Map<string, { value: boolean; expiresAt: number }>();
  private ttlMs = 60_000;
  private client: any = null;
  // debug snapshot for external inspection
  public __debug: {
    envKeyPresent: boolean;
    initTried: boolean;
    initOk: boolean;
    hasFeatureAvailable: boolean;
    lastKey?: string;
    lastValue?: boolean;
    lastError?: string;
    fromCache?: boolean;
  } = {
    envKeyPresent: Boolean(process.env.FLAGSMITH_ENV_KEY || this.env.FLAGSMITH_ENV_KEY),
    initTried: false,
    initOk: false,
    hasFeatureAvailable: false,
  };

  async getFlag(key: string, ctx?: FlagContext): Promise<FlagResult> {
    void ctx;
    const now = Date.now();
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > now) {
      this.__debug.lastKey = key;
      this.__debug.lastValue = cached.value as unknown as boolean;
      this.__debug.fromCache = true;
      return { enabled: Boolean(cached.value), value: undefined };
    }

    let enabled = false;
    let flagValue: string | number | boolean | null | undefined = undefined;
    if (!this.client && this.env.FLAGSMITH_ENV_KEY) {
      try {
        this.__debug.initTried = true;
        if (DEBUG) console.log('[flags] init: starting');
        const flagsmith = require('flagsmith-nodejs');
        if (typeof flagsmith?.init === 'function') {
          await flagsmith.init({ environmentKey: this.env.FLAGSMITH_ENV_KEY });
        }
        this.client = flagsmith;
        this.__debug.initOk = true;
        if (DEBUG) console.log('[flags] init: success');
      } catch (e: any) {
        this.__debug.initOk = false;
        this.__debug.lastError = String(e?.message || e);
        if (DEBUG) console.error('[flags] init: failed');
        this.client = null;
      }
    }
    if (this.client) {
      try {
        const api = this.client?.default ?? this.client;
        const hasFeature = typeof api?.hasFeature === 'function' ? api.hasFeature : undefined;
        const getValue = typeof api?.getValue === 'function' ? api.getValue : undefined;
        if (!hasFeature) {
          if (DEBUG) console.error('[flags] hasFeature not available on SDK export');
          this.__debug.hasFeatureAvailable = false;
          enabled = false;
        } else {
          const res = await hasFeature.call(api, key);
          enabled = Boolean(res);
          this.__debug.hasFeatureAvailable = true;
          if (DEBUG) console.log('[flags] hasFeature:', key, enabled);
          if (getValue) {
            try {
              const v = await getValue.call(api, key);
              flagValue = v as any;
              if (DEBUG) console.log('[flags] getValue:', key, flagValue);
            } catch (e: any) {
              if (DEBUG) console.error('[flags] getValue error:', key, e?.message || e);
            }
          }
        }
      } catch (err: any) {
        this.__debug.lastError = String(err?.message || err);
        if (DEBUG) console.error('[flags] hasFeature error:', key, err);
        enabled = false;
      }
    }
    // REST fallback if SDK method unavailable
    if (this.__debug.hasFeatureAvailable === false && this.env.FLAGSMITH_ENV_KEY) {
      try {
        const resp = await fetch('https://edge.api.flagsmith.com/api/v1/flags/', {
          headers: {
            'X-Environment-Key': this.env.FLAGSMITH_ENV_KEY,
            Authorization: this.env.FLAGSMITH_ENV_KEY,
          } as Record<string, string>,
        });
        if (resp.ok) {
          const data = (await resp.json()) as Array<{
            feature?: { name?: string };
            enabled?: boolean;
            feature_state_value?: unknown;
            value?: unknown;
          }>;
          const match = data.find((f) => f?.feature?.name === key);
          if (match) {
            if (typeof match.enabled === 'boolean') enabled = match.enabled;
            const mv = (match as any).feature_state_value ?? (match as any).value;
            if (mv !== undefined) flagValue = mv as any;
            if (DEBUG) console.log('[flags] REST fallback:', key, enabled, flagValue);
          } else if (DEBUG) {
            console.warn('[flags] REST fallback: flag not found', key);
          }
        } else if (DEBUG) {
          console.error('[flags] REST fallback http error', resp.status);
        }
      } catch (e: any) {
        if (DEBUG) console.error('[flags] REST fallback error', e?.message || e);
      }
    }
    if (!this.env.FLAGSMITH_ENV_KEY && DEBUG) console.warn('[flags] FLAGSMITH_ENV_KEY not set');
    this.cache.set(key, { value: enabled, expiresAt: now + this.ttlMs });
    this.__debug.lastKey = key;
    this.__debug.lastValue = enabled;
    this.__debug.fromCache = false;
    return { enabled, value: flagValue };
  }
}

export function createFlagProvider(): FlagProvider {
  return new FlagsmithProvider();
}

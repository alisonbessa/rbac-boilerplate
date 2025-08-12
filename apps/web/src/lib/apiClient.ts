import { API_URL } from './config';

export function getDeviceId(): string {
  const KEY = 'deviceId';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

function getCookie(name: string): string | undefined {
  if (!document.cookie) return undefined;
  const encoded = encodeURIComponent(name) + '=';
  const parts = document.cookie.split('; ');
  for (const part of parts) {
    if (part.startsWith(encoded) || part.startsWith(name + '=')) {
      const value = part.substring(part.indexOf('=') + 1);
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return undefined;
}

async function ensureCsrfToken(): Promise<string> {
  const existing = getCookie('csrf');
  if (existing) return existing;
  const res = await fetch(`${API_URL}/api/v1/auth/csrf`, { credentials: 'include' });
  try {
    const json = (await res.json()) as { token?: string };
    return json.token || getCookie('csrf') || '';
  } catch {
    return getCookie('csrf') || '';
  }
}

function isStateChanging(method: string) {
  const m = method.toUpperCase();
  return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  const url = input.startsWith('http') ? input : `${API_URL}${input}`;
  const headers = new Headers(init.headers);
  headers.set('X-Device-Id', getDeviceId());
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');

  // Attach CSRF token for state-changing requests (except when requesting the token route itself)
  const method = (init.method || 'GET').toUpperCase();
  const isCsrfEndpoint = url.includes('/api/v1/auth/csrf');
  if (isStateChanging(method) && !isCsrfEndpoint) {
    const token = await ensureCsrfToken();
    if (token) headers.set('X-CSRF-Token', token);
  }

  const doRequest = () =>
    fetch(url, {
      credentials: 'include',
      ...init,
      headers,
    });

  let res = await doRequest();

  // If unauthorized/expired, try refresh flow once
  if (res.status === 401 || res.status === 419) {
    try {
      await ensureCsrfToken();
      const refreshRes = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': getDeviceId(),
          'X-CSRF-Token': getCookie('csrf') || '',
        },
        body: JSON.stringify({ deviceId: getDeviceId() }),
      });
      if (refreshRes.ok) {
        res = await doRequest();
      }
    } catch {
      void 0;
    }
  }
  // If CSRF missing (403) on state-changing calls, try obtain token then retry once
  if (res.status === 403 && isStateChanging(method)) {
    await ensureCsrfToken();
    headers.set('X-CSRF-Token', getCookie('csrf') || '');
    res = await doRequest();
  }
  return res;
}

import React, { useState } from 'react';
import { apiFetch } from '../../lib/apiClient';

export function LoginForm() {
  const [email, setEmail] = useState('pro@example.com');
  const [password, setPassword] = useState('password123');
  const [deviceId, setDeviceId] = useState('device-123');
  const [message, setMessage] = useState('');

  async function ensureCsrf() {
    await apiFetch('/api/v1/auth/csrf');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    await ensureCsrf();
    const res = await apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, deviceId }),
    });
    if (res.ok) setMessage('Logged in');
    else setMessage(`Login failed: ${res.status}`);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-3">
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          className="border px-2 py-1 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Password</label>
        <input
          type="password"
          className="border px-2 py-1 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Device ID</label>
        <input
          className="border px-2 py-1 w-full"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
        />
      </div>
      <button type="submit" className="bg-black text-white px-3 py-1 rounded">
        Login
      </button>
      {message && <p className="text-sm">{message}</p>}
    </form>
  );
}

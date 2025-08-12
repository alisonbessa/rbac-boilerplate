import React, { useState } from 'react';
import { apiFetch } from '../../lib/apiClient';
import { sha256Hex } from '../../lib/crypto';
import { useAuth } from './AuthContext';
import { useNavigate } from '@tanstack/react-router';

export function RegisterForm() {
  const [name, setName] = useState('New User');
  const [email, setEmail] = useState('new.user@example.com');
  const [password, setPassword] = useState('password123');
  const [roleInit, setRoleInit] = useState<'professional' | 'client'>('client');
  // device id is handled automatically by api client (X-Device-Id)
  const [message, setMessage] = useState('');
  const { refresh } = useAuth();
  const navigate = useNavigate();

  async function ensureCsrf() {
    await apiFetch('/api/v1/auth/csrf');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    await ensureCsrf();
    const passwordHashClient = await sha256Hex(password);
    // Register
    const regRes = await apiFetch('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, passwordHashClient, name, roleInit }),
    });
    if (!regRes.ok) {
      setMessage(`Register failed: ${regRes.status}`);
      return;
    }
    // Immediately login to create session/refresh+did
    const loginRes = await apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, passwordHashClient }),
    });
    if (!loginRes.ok) {
      setMessage(`Auto-login failed: ${loginRes.status}`);
      return;
    }
    await refresh();
    navigate({ to: '/app' });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-3">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          className="border px-2 py-1 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
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
        <label className="block text-sm font-medium">Initial role</label>
        <select
          className="border px-2 py-1 w-full"
          value={roleInit}
          onChange={(e) => setRoleInit(e.target.value as 'professional' | 'client')}
        >
          <option value="professional">Professional</option>
          <option value="client">Client</option>
        </select>
      </div>
      <button type="submit" className="bg-black text-white px-3 py-1 rounded">
        Create account
      </button>
      {message && <p className="text-sm">{message}</p>}
    </form>
  );
}

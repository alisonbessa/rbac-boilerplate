import React from 'react';
import { LoginForm } from '../features/auth/Login';
import { RegisterForm } from '../features/auth/Register';

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h2 className="text-2xl font-semibold mb-6">Login</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded border p-4">
          <LoginForm />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Create an account</h3>
          <div className="rounded border p-4">
            <RegisterForm />
          </div>
        </div>
      </div>
    </section>
  );
}

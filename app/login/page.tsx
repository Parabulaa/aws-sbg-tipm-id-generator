'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, errorText } from '@/lib/client';

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    void api('session')
      .then(() => router.replace('/dashboard'))
      .catch(() => {});
  }, [router]);
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <Link href="/" className="text-sm font-semibold text-amber-700">
          ← Public home
        </Link>
        <h1 className="mt-6 text-3xl font-bold">Officer Login</h1>
        <p className="mt-2 text-slate-600">
          Authorized AWS SBG TIP Manila officers only.
        </p>
        <form
          className="mt-7 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError('');
            const form = new FormData(event.currentTarget);
            try {
              await api('login', {
                method: 'POST',
                body: JSON.stringify({
                  email: form.get('email'),
                  password: form.get('password'),
                }),
              });
              router.replace('/dashboard');
            } catch (error) {
              setError(errorText(error));
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="field">
            T.I.P./Officer Email
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label className="field">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          {error && (
            <p role="alert" className="notice-error">
              {error}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

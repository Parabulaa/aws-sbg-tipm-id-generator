'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { errorText } from '@/lib/client';
import {
  browserSupabaseConfig,
  getSupabaseBrowserClient,
} from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const configured = browserSupabaseConfig().configured;
  useEffect(() => {
    if (!configured) return;
    void getSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) router.replace('/dashboard');
      });
  }, [configured, router]);
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
              const email = form.get('email');
              const password = form.get('password');
              if (typeof email !== 'string' || typeof password !== 'string')
                throw new Error('Enter your officer email and password.');
              const { error } =
                await getSupabaseBrowserClient().auth.signInWithPassword({
                  email,
                  password,
                });
              if (error)
                throw new Error(
                  'Email or password is incorrect, or this account is not available.',
                );
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
          <button className="btn-primary w-full" disabled={busy || !configured}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          {!configured && (
            <p className="notice-error">
              Supabase is not configured. Add the project URL and publishable
              key to .env.local.
            </p>
          )}
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

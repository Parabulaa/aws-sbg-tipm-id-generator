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
    <main className="grid min-h-screen place-items-center bg-slate-950 px-5 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[.06] p-7 shadow-2xl backdrop-blur sm:p-9">
        <div className="mb-8 flex items-center justify-between">
          <div className="grid size-11 place-items-center rounded-xl bg-amber-500 text-xs font-black text-slate-950">AWS</div>
          <Link href="/" className="text-sm font-semibold text-amber-300 transition hover:text-amber-200">← Public home</Link>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">SBG · TIP Manila</p>
        <h1 className="mt-3 text-3xl font-bold">Officer Login</h1>
        <p className="mt-2 text-slate-300">Sign in to manage member records and generate IDs.</p>
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
            <span className="text-slate-200">T.I.P./Officer Email</span>
            <input className="border-white/15 bg-slate-900/70 text-white placeholder:text-slate-500" name="email" type="email" autoComplete="username" required />
          </label>
          <label className="field">
            <span className="text-slate-200">Password</span>
            <input
              className="border-white/15 bg-slate-900/70 text-white placeholder:text-slate-500"
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

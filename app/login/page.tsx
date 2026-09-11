'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { errorText } from '@/lib/client';
import { browserSupabaseConfig, getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const configured = browserSupabaseConfig().configured;
  useEffect(() => {
    if (!configured) return;
    void getSupabaseBrowserClient().auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard');
    });
  }, [configured, router]);
  return (
    <main className="internal-public-page flex min-h-screen flex-col px-6 sm:px-10">
      <header className="mx-auto flex w-full max-w-7xl items-center py-7 sm:py-8">
        <Link href="/" className="leading-tight text-[#E0F2F5]">
          <span className="block text-base font-semibold">AWS SBG TIP Manila</span>
          <span className="mt-1 block text-sm text-[#9AD3E0]/70">ID Generator</span>
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center py-12 sm:pb-24">
        <section className="internal-login-panel internal-enter w-full max-w-[420px]">
          <h1 className="text-3xl font-semibold tracking-[-0.025em] text-[#E0F2F5] sm:text-4xl">Officer Login</h1>
          <p className="mt-3 text-base leading-7 text-[#E0F2F5]/65">Access is limited to authorized AWS SBG TIP Manila officers.</p>
          <form className="mt-8 space-y-5" onSubmit={async (event) => {
            event.preventDefault(); setBusy(true); setError('');
            const form = new FormData(event.currentTarget);
            try {
              const email = form.get('email'); const password = form.get('password');
              if (typeof email !== 'string' || typeof password !== 'string') throw new Error('Enter your officer email and password.');
              const { error } = await getSupabaseBrowserClient().auth.signInWithPassword({ email, password });
              if (error) throw new Error('Email or password is incorrect, or this account is not available.');
              router.replace('/dashboard');
            } catch (error) { setError(errorText(error)); } finally { setBusy(false); }
          }}>
            <label className="internal-login-field"><span>Officer Email</span><input name="email" type="email" autoComplete="username" required /></label>
            <label className="internal-login-field"><span>Password</span><input name="password" type="password" autoComplete="current-password" required /></label>
            <button className="internal-action w-full" disabled={busy || !configured}>
              <span>{busy ? 'Signing in…' : 'Login'}</span>{!busy && <span className="internal-action-arrow" aria-hidden="true">→</span>}
            </button>
            {!configured && <p className="internal-login-error">Supabase is not configured.</p>}
            {error && <p role="alert" className="internal-login-error">{error}</p>}
          </form>
          <Link href="/" className="mt-7 inline-block text-sm text-[#9AD3E0]/70 transition-colors duration-200 hover:text-[#9AD3E0]">← Back to home</Link>
        </section>
      </div>
    </main>
  );
}

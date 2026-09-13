'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Eye, EyeOff, IdCard, Lock, Mail, ShieldCheck, UsersRound } from 'lucide-react';
import { errorText } from '@/lib/client';
import { browserSupabaseConfig, getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const configured = browserSupabaseConfig().configured;

  useEffect(() => {
    if (!configured) return;
    void getSupabaseBrowserClient().auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard');
    });
  }, [configured, router]);

  async function submitLogin(event: { preventDefault: () => void; currentTarget: HTMLFormElement }) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const email = form.get('email');
      const password = form.get('password');
      if (typeof email !== 'string' || typeof password !== 'string') {
        throw new Error('Enter your officer email and password.');
      }
      const { error } = await getSupabaseBrowserClient().auth.signInWithPassword({ email, password });
      if (error) throw new Error('Email or password is incorrect, or this account is not available.');
      router.replace('/dashboard');
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  function preparePublicNavigation(event: { preventDefault: () => void }, targetPath: string, direction: 'forward' | 'reverse') {
    if (pathname === targetPath) {
      event.preventDefault();
      return;
    }
    sessionStorage.setItem('public-route-direction', direction);
  }

  return (
    <main className="public-shell public-route public-route-login">
      <div className="public-container">
        <header className="public-header">
          <Link href="/" className="public-brand" aria-label="AWS SBG TIP Manila home" onClick={(event) => preparePublicNavigation(event, '/', 'reverse')}>
            <span className="public-logo"><span className="public-logo-mark" aria-hidden="true" /></span>
            <span>
              <strong>AWS SBG TIP Manila</strong>
              <small>ID Generator</small>
            </span>
          </Link>
        </header>

        <section className="public-hero public-login-hero">
          <div className="public-hero-copy">
            <p className="public-eyebrow">IT&apos;S ALWAYS DAY ONE.</p>
            <h1>Officer Login</h1>
            <p className="public-description">
              Sign in to access the AWS SBG TIP Manila ID Generator workspace.
            </p>
            <div className="public-login-points" aria-label="Officer tools">
              <span><ShieldCheck aria-hidden="true" /><strong>Secure Access</strong><small>Authorized officers only</small></span>
              <span><UsersRound aria-hidden="true" /><strong>Manage Members</strong><small>Import and organize</small></span>
              <span><IdCard aria-hidden="true" /><strong>Generate IDs</strong><small>Create and assign</small></span>
            </div>
          </div>

          <section className="internal-login-panel public-login-panel" aria-labelledby="login-heading">
            <h2 id="login-heading">Officer Login</h2>
            <p>Access is limited to authorized AWS SBG TIP Manila officers.</p>
            <form onSubmit={submitLogin}>
              <label className="internal-login-field public-input-field">
                <span>Officer Email</span>
                <span className="public-input-wrap">
                  <Mail aria-hidden="true" />
                  <input name="email" type="email" autoComplete="username" placeholder="name@tip.edu.ph" required />
                </span>
              </label>
              <label className="internal-login-field public-input-field">
                <span>Password</span>
                <span className="public-input-wrap">
                  <Lock aria-hidden="true" />
                  <input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" required />
                  <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </button>
                </span>
              </label>
              <button className="public-primary-action" disabled={busy || !configured}>
                <span>{busy ? 'Signing in...' : 'Login'}</span>{!busy && <ArrowRight aria-hidden="true" />}
              </button>
              <Link href="/" className="public-back-link" onClick={(event) => preparePublicNavigation(event, '/', 'reverse')}>
                <ArrowLeft aria-hidden="true" /> Back to home
              </Link>
              {!configured && <p className="internal-login-error">Supabase is not configured.</p>}
              {error && <p role="alert" className="internal-login-error">{error}</p>}
            </form>
          </section>
        </section>

        <footer className="public-footer">
          <div>
            <strong>AWS SBG TIP Manila</strong>
            <span>It&apos;s always day one.</span>
          </div>
          <nav aria-label="Footer links">
            <a href="mailto:awslc.mnl@tip.edu.ph" aria-label="Email AWS SBG TIP Manila"><Mail aria-hidden="true" /></a>
            <a href="https://www.facebook.com/awssbgtip" target="_blank" rel="noreferrer" aria-label="AWS SBG TIP Manila Facebook page"><span aria-hidden="true">f</span></a>
          </nav>
          <p className="public-footer-copy">© 2026 AWS SBG TIP Manila.<br />All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}

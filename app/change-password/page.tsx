'use client';
import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { api, errorText } from '@/lib/client';

export default function ChangePasswordPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawPassword = form.get('password');
    const rawConfirm = form.get('confirm');
    const password = typeof rawPassword === 'string' ? rawPassword : '';
    const confirm = typeof rawConfirm === 'string' ? rawConfirm : '';
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('account/password', {
        method: 'PUT',
        body: JSON.stringify({ password }),
      });
      window.location.assign('/dashboard');
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="public-shell">
      <section className="auth-page login-page">
        <div className="auth-card">
          <h1>Change Password</h1>
          <p>Set a permanent password before entering the dashboard.</p>
          <form onSubmit={submit} className="login-form">
            <label>
              New password
              <span><Lock aria-hidden="true" /><input name="password" type="password" minLength={8} required placeholder="Enter new password" /></span>
            </label>
            <label>
              Confirm password
              <span><Lock aria-hidden="true" /><input name="confirm" type="password" minLength={8} required placeholder="Confirm new password" /></span>
            </label>
            {error && <p className="notice-error" role="alert">{error}</p>}
            <button disabled={busy}>{busy ? <Loader2 className="size-5 animate-spin" /> : null} Save password</button>
          </form>
        </div>
      </section>
    </main>
  );
}

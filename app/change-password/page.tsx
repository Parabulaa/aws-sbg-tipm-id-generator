'use client';
import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { api, errorText } from '@/lib/client';
import { validateNewPassword } from '@/lib/password';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
    const validationError = validateNewPassword(password, confirm);
    if (validationError) {
      setError(validationError);
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
    <main className="public-shell forced-password-page">
      <Dialog open>
        <DialogContent className="member-dialog forced-password-dialog sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Set a permanent password before entering the dashboard.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="change-password-form">
            <label>
              New password
              <span className="password-input-wrap"><Lock aria-hidden="true" /><input name="password" type="password" autoComplete="new-password" minLength={8} required placeholder="Enter new password" /></span>
            </label>
            <label>
              Confirm password
              <span className="password-input-wrap"><Lock aria-hidden="true" /><input name="confirm" type="password" autoComplete="new-password" minLength={8} required placeholder="Confirm new password" /></span>
            </label>
            {error && <p className="notice-error" role="alert">{error}</p>}
            <DialogFooter>
              <button className="btn-primary" disabled={busy}>{busy ? <Loader2 className="size-5 animate-spin" /> : null} Save password</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

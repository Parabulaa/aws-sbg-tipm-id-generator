'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  FileBadge2,
  FolderCog,
  LayoutDashboard,
  Loader2,
  KeyRound,
  Menu,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sparkles,
  Clock3,
  Users,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useData } from './data-provider';
import { api, clearPrivateAssetCache, errorText } from '@/lib/client';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { AdminNotice, type AdminNoticeState } from './admin-notice';
import { validateNewPassword } from '@/lib/password';
const navigation = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Generate ID', href: '/generate-id', icon: Sparkles },
  { label: 'Members', href: '/members', icon: Users },
  { label: 'Templates', href: '/templates', icon: FolderCog },
  { label: 'Generated IDs', href: '/generated-ids', icon: FileBadge2 },
];
const adminNavigation = [
  { label: 'Access Management', href: '/admin/access-management', icon: ShieldCheck },
  { label: 'Activity Logs', href: '/admin/activity-logs', icon: Clock3 },
];
export function Sidebar({ collapsed = false, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role } = useData();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [notice, setNotice] = useState<AdminNoticeState>(null);

  async function changePassword(event: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const field = (name: string) => {
      const value = form.get(name);
      return typeof value === 'string' ? value : '';
    };
    const currentPassword = field('current_password');
    const password = field('password');
    const confirmation = field('confirmation');
    const validationError = validateNewPassword(password, confirmation);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }
    setPasswordBusy(true);
    setPasswordError('');
    try {
      await api('account/password', {
        method: 'PUT',
        body: JSON.stringify({ current_password: currentPassword, password, voluntary: true }),
      });
      event.currentTarget.reset();
      setPasswordOpen(false);
      setNotice({ type: 'success', message: 'Your password was changed successfully.' });
    } catch (caught) {
      setPasswordError(errorText(caught));
    } finally {
      setPasswordBusy(false);
    }
  }
  async function signOut() {
    setSigningOut(true);
    setError('');
    try {
      const { error } = await getSupabaseBrowserClient().auth.signOut();
      if (error) throw error;
      clearPrivateAssetCache();
      setLogoutOpen(false);
      router.replace('/login');
    } catch (caught) {
      setError(errorText(caught));
      setSigningOut(false);
    }
  }
  function content(compact = collapsed) {
    return (
      <>
        <div className={`flex items-center ${compact ? 'justify-center' : 'justify-between gap-2'}`}>
          <Brand compact={compact} onExpand={compact ? onToggle : undefined} />
          {!compact && onToggle && <CollapseButton collapsed={collapsed} onClick={onToggle} />}
        </div>
        <nav className="mt-6 space-y-1.5" aria-label="Main navigation">
          {navigation.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={pathname === href ? 'page' : undefined}
              title={compact ? label : undefined}
              className={`flex min-h-10 items-center rounded-lg border px-3 text-sm font-semibold transition-colors ${compact ? 'justify-center' : 'gap-3'} ${pathname === href ? 'border-cyan-300/25 bg-[#182d35] text-cyan-100' : 'border-transparent text-slate-300 hover:border-slate-600 hover:bg-slate-800'}`}
            >
              <Icon className="size-[18px] shrink-0" />
              {!compact && label}
            </Link>
          ))}
        </nav>
        {role === 'admin' && (
          <nav className="mt-6 space-y-1.5" aria-label="Admin navigation">
            {!compact && (
              <p className="px-1 pb-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-cyan-100/70">
                Admin
              </p>
            )}
            {adminNavigation.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={pathname === href ? 'page' : undefined}
                title={compact ? label : undefined}
                className={`flex min-h-10 items-center rounded-lg border px-3 text-sm font-semibold transition-colors ${compact ? 'justify-center' : 'gap-3'} ${pathname === href ? 'border-cyan-300/25 bg-[#182d35] text-cyan-100' : 'border-transparent text-slate-300 hover:border-slate-600 hover:bg-slate-800'}`}
              >
                <Icon className="size-[18px] shrink-0" />
                {!compact && label}
              </Link>
            ))}
          </nav>
        )}
        <div className="mt-auto border-t border-slate-200 pt-4">
          <div className={compact ? 'text-center' : 'rounded-lg border border-slate-700 bg-slate-900 p-3'}>
            {!compact && <>
            <p className="break-words text-sm font-semibold">{user}</p>
            <p className="mt-0.5 text-xs capitalize text-slate-500">{role}</p>
            <button className="btn mt-2 w-full" type="button" onClick={() => { setPasswordError(''); setPasswordOpen(true); }}>
              <KeyRound className="size-4" /> Change Password
            </button>
            </>}
            <button
              className={`btn ${compact ? 'size-10 px-0' : 'mt-2 w-full'}`}
              title="Sign out"
              disabled={signingOut}
              onClick={() => setLogoutOpen(true)}
            >
              {signingOut ? <Loader2 className="size-4 animate-spin" /> : compact ? <LogOut className="size-4" /> : 'Sign out'}
            </button>
          </div>
          {error && (
            <p role="alert" className="notice-error">
              {error}
            </p>
          )}
        </div>
      </>
    );
  }
  return (
    <>
      <AdminNotice notice={notice} onDismiss={() => setNotice(null)} />
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-slate-200 bg-white p-4 lg:hidden">
        <Brand />
        <button
          type="button"
          className="btn"
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" />
        </button>
      </header>
      <aside className={`fixed inset-y-0 left-0 z-20 hidden flex-col overflow-y-auto border-r border-slate-800 bg-[#040d0e] p-4 text-white transition-[width] duration-200 lg:flex ${collapsed ? 'w-[76px]' : 'w-[240px]'}`}>
        {content()}
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="max-w-[290px] p-5">
          <SheetTitle className="sr-only">Organization navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Choose a page in the ID generator.
          </SheetDescription>
          {content(false)}
        </SheetContent>
      </Sheet>
      <Dialog open={logoutOpen} onOpenChange={(next) => { if (!signingOut) setLogoutOpen(next); }}>
        <DialogContent className="member-dialog logout-dialog sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Log out of AWS SBG ID Generator?</DialogTitle>
            <DialogDescription>
              Your current session will end, and you will return to the officer login page.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="notice-error" role="alert">{error}</p>}
          <DialogFooter className="logout-dialog-actions">
            <button className="btn" type="button" disabled={signingOut} onClick={() => setLogoutOpen(false)}>
              Stay signed in
            </button>
            <button className="btn-primary" type="button" disabled={signingOut} onClick={() => void signOut()}>
              {signingOut ? <><Loader2 className="size-4 animate-spin" /> Logging out...</> : <><LogOut className="size-4" /> Log out</>}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={passwordOpen} onOpenChange={(next) => { if (!passwordBusy) { setPasswordOpen(next); setPasswordError(''); } }}>
        <DialogContent className="member-dialog sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Confirm your current password, then choose a new password.</DialogDescription>
          </DialogHeader>
          <form className="change-password-form" onSubmit={changePassword}>
            <label>Current Password<input name="current_password" type="password" autoComplete="current-password" required /></label>
            <label>New Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
            <label>Confirm New Password<input name="confirmation" type="password" autoComplete="new-password" minLength={8} required /></label>
            {passwordError && <p className="notice-error" role="alert">{passwordError}</p>}
            <DialogFooter>
              <button className="btn" type="button" disabled={passwordBusy} onClick={() => setPasswordOpen(false)}>Cancel</button>
              <button className="btn-primary" disabled={passwordBusy}>{passwordBusy && <Loader2 className="size-4 animate-spin" />}{passwordBusy ? 'Changing...' : 'Change Password'}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
function CollapseButton({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return <button type="button" className="hidden size-10 shrink-0 place-items-center rounded-lg border border-slate-700 bg-slate-900 text-cyan-200 hover:bg-slate-800 lg:grid" aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={onClick}><Icon className="size-5" /></button>;
}
function Brand({ compact = false, onExpand }: { compact?: boolean; onExpand?: () => void }) {
  const badge = <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-cyan-300/30 bg-[#18313a] text-sm font-black text-cyan-100">AWS</span>;
  return (
    <div className="flex min-w-0 items-center gap-3">
      {onExpand ? <button type="button" aria-label="Expand navigation" title="Expand navigation" onClick={onExpand}>{badge}</button> : badge}
      {!compact && <div className="min-w-0">
        <p className="truncate text-sm font-bold">AWS SBG TIP Manila</p>
        <p className="text-xs text-cyan-200/70">ID Generator</p>
      </div>}
    </div>
  );
}

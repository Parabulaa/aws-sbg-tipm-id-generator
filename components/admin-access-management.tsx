'use client';
import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Save, Search, ShieldCheck, Users } from 'lucide-react';
import { api, errorText } from '@/lib/client';
import { useData } from './data-provider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type OfficerRole = 'admin' | 'officer';
type OfficerAccount = {
  id: string;
  email: string;
  display_name: string;
  role: OfficerRole;
  is_active: boolean;
  must_change_password: boolean;
  password_changed_at: string | null;
};
type FormSubmit = { preventDefault(): void; currentTarget: HTMLFormElement };
type Notice = { type: 'success' | 'error'; message: string } | null;
const formText = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
};

export function AdminAccessManagement() {
  const { role } = useData();
  const [accounts, setAccounts] = useState<OfficerAccount[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [addOpen, setAddOpen] = useState(false);

  const selected = accounts.find((account) => account.id === selectedId) ?? accounts[0];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return accounts.filter((account) => {
      const matchesSearch =
        !needle ||
        `${account.display_name} ${account.email}`.toLowerCase().includes(needle);
      return matchesSearch && (!filterRole || account.role === filterRole);
    });
  }, [accounts, filterRole, query]);
  const admins = accounts.filter((account) => account.role === 'admin').length;
  const officers = accounts.filter((account) => account.role === 'officer').length;

  async function load() {
    setBusy(true);
    setNotice(null);
    try {
      const data = await api<OfficerAccount[]>('officers');
      setAccounts(data);
      setSelectedId((current) => current || data[0]?.id || '');
    } catch (caught) {
      setNotice({ type: 'error', message: errorText(caught) });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (role === 'admin') queueMicrotask(() => void load());
  }, [role]);

  async function save(account: OfficerAccount) {
    setBusy(true);
    setNotice(null);
    try {
      const saved = await api<OfficerAccount>(`officers/${account.id}`, {
        method: 'PUT',
        body: JSON.stringify(account),
      });
      setAccounts((items) => items.map((item) => item.id === saved.id ? saved : item));
      setSelectedId(saved.id);
      setNotice({ type: 'success', message: 'Account updated successfully.' });
    } catch (caught) {
      setNotice({ type: 'error', message: errorText(caught) });
    } finally {
      setBusy(false);
    }
  }

  async function createOfficer(event: FormSubmit) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setNotice(null);
    try {
      const created = await api<OfficerAccount>('officers', {
        method: 'POST',
        body: JSON.stringify({
          display_name: formText(form, 'display_name'),
          email: formText(form, 'email'),
          password: formText(form, 'password'),
        }),
      });
      setAccounts((items) => [...items, created].sort((a, b) => a.display_name.localeCompare(b.display_name)));
      setSelectedId(created.id);
      setAddOpen(false);
      setNotice({ type: 'success', message: 'Officer account created successfully.' });
    } catch (caught) {
      setNotice({ type: 'error', message: errorText(caught) });
    } finally {
      setBusy(false);
    }
  }

  if (role !== 'admin')
    return <p className="notice-error mt-4">Administrator rights are required for Access Management.</p>;

  return (
    <div className="admin-page">
      <AdminNotice notice={notice} />
      <div className="admin-top-action">
        <button className="btn-primary" onClick={() => setAddOpen(true)}><Plus className="size-4" /> Add Officer</button>
      </div>
      <section className="admin-metrics three">
        <Metric icon={<Users />} label="Total Accounts" value={accounts.length} />
        <Metric icon={<ShieldCheck />} label="Admins" value={admins} tone="green" />
        <Metric icon={<Users />} label="Officers" value={officers} tone="violet" />
      </section>
      <section className="admin-access-grid">
        <article className="admin-panel">
          <header className="admin-panel-header">
            <h2>User Accounts</h2>
            <div className="admin-filter-row">
              <label className="admin-search">
                <Search className="size-4" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email..." />
              </label>
              <select value={filterRole} onChange={(event) => setFilterRole(event.target.value)}>
                <option value="">All Roles</option>
                <option value="admin">Admins</option>
                <option value="officer">Officers</option>
              </select>
            </div>
          </header>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Password Change</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((account) => (
                  <tr key={account.id} className={selected?.id === account.id ? 'is-selected' : ''}>
                    <td>{account.display_name}</td>
                    <td>{account.email}</td>
                    <td><span className={`admin-pill ${account.role}`}>{account.role}</span></td>
                    <td><Status active={account.is_active} /></td>
                    <td>{account.must_change_password ? 'Yes' : 'No'}</td>
                    <td><button className="btn" onClick={() => setSelectedId(account.id)}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <SelectedUser account={selected} busy={busy} onSave={save} />
      </section>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="member-dialog sm:max-w-lg">
          <form onSubmit={createOfficer}>
            <DialogHeader>
              <DialogTitle>Add officer</DialogTitle>
              <DialogDescription>Create an officer login with a temporary password.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-3">
              <label className="field">Display name<input name="display_name" required maxLength={120} /></label>
              <label className="field">Email<input name="email" type="email" required /></label>
              <label className="field">Temporary password<input name="password" type="password" required minLength={8} /></label>
            </div>
            <DialogFooter>
              <button type="button" className="btn" onClick={() => setAddOpen(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Create officer</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SelectedUser({ account, busy, onSave }: { account?: OfficerAccount; busy: boolean; onSave: (account: OfficerAccount) => Promise<void> }) {
  const [draft, setDraft] = useState<OfficerAccount | undefined>(account);
  useEffect(() => {
    queueMicrotask(() => setDraft(account));
  }, [account]);
  if (!draft) return <aside className="admin-panel selected-user"><h2>Selected User</h2><p>No officer selected.</p></aside>;
  return (
    <aside className="admin-panel selected-user">
      <h2>Selected User</h2>
      <label className="field">Display Name<input value={draft.display_name} onChange={(e) => setDraft({ ...draft, display_name: e.target.value })} /></label>
      <label className="field">Email<input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
      <label className="field">Role<select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as OfficerRole })}><option value="admin">Admin</option><option value="officer">Officer</option></select></label>
      <Toggle label="Active Account" checked={draft.is_active} onChange={(checked) => setDraft({ ...draft, is_active: checked })} />
      <Toggle label="Require Password Change" checked={draft.must_change_password} onChange={(checked) => setDraft({ ...draft, must_change_password: checked })} />
      <button className="btn-primary" disabled={busy} onClick={() => void onSave(draft)}>{busy ? <><Loader2 className="size-4 animate-spin" /> Saving...</> : <><Save className="size-4" /> Save Changes</>}</button>
    </aside>
  );
}

function Metric({ icon, label, value, tone = 'cyan' }: { icon: React.ReactNode; label: string; value: number; tone?: string }) {
  return <article className={`admin-metric ${tone}`}><span>{icon}</span><div><p>{label}</p><strong>{value}</strong></div></article>;
}
function Status({ active }: { active: boolean }) {
  return <span className={`admin-status ${active ? 'active' : 'disabled'}`}><i />{active ? 'Active' : 'Disabled'}</span>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="admin-toggle"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i /></label>;
}

function AdminNotice({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return (
    <output className={`app-toast-${notice.type}`}>
      <strong>{notice.type === 'success' ? 'Saved' : 'Action needed'}</strong>
      <span>{notice.message}</span>
    </output>
  );
}

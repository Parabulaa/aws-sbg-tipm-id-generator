'use client';
import { useEffect, useMemo, useState } from 'react';
import { Clock3, Download, FileText, RefreshCw, Search, ShieldCheck, Users } from 'lucide-react';
import { api, errorText } from '@/lib/client';
import { useData } from './data-provider';
import { AdminNotice, type AdminNoticeState } from './admin-notice';

type Log = {
  id: string;
  user_name: string;
  user_role: 'admin' | 'officer';
  action: string;
  status: string;
  target_name?: string | null;
  actor_email?: string;
  category?: string;
  target_type?: string | null;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};
export function AdminActivityLogs() {
  const { role } = useData();
  const [logs, setLogs] = useState<Log[]>([]);
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('');
  const [actor, setActor] = useState('');
  const [category, setCategory] = useState('');
  const [actorRole, setActorRole] = useState('');
  const [range, setRange] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<AdminNoticeState>(null);
  const [now, setNow] = useState(() => Date.now());

  async function load() {
    setBusy(true);
    setNotice(null);
    try {
      setLogs(await api<Log[]>('activity-logs'));
      setNow(Date.now());
    } catch (caught) {
      setNotice({ type: 'error', message: errorText(caught) });
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (role === 'admin') queueMicrotask(() => void load());
  }, [role]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const today = new Date().toDateString();
    return logs.filter((log) => {
      const matchesSearch = !needle || `${log.user_name} ${log.actor_email ?? ''} ${log.action} ${log.target_name ?? ''} ${log.description ?? ''}`.toLowerCase().includes(needle);
      const matchesAction = !action || log.action === action;
      const matchesActor = !actor || log.user_name === actor;
      const matchesCategory = !category || log.category === category;
      const matchesRole = !actorRole || log.user_role === actorRole;
      const created = new Date(log.created_at);
      const age = now - created.getTime();
      const matchesRange =
        !range ||
        (range === 'today' && created.toDateString() === today) ||
        (range === '7' && age <= 7 * 24 * 60 * 60 * 1000) ||
        (range === '30' && age <= 30 * 24 * 60 * 60 * 1000);
      return matchesSearch && matchesAction && matchesActor && matchesCategory && matchesRole && matchesRange;
    });
  }, [action, actor, actorRole, category, logs, now, query, range]);
  const actions = Array.from(new Set(logs.map((log) => log.action))).sort();
  const actors = Array.from(new Set(logs.map((log) => log.user_name))).sort();
  const categories = Array.from(new Set(logs.map((log) => log.category).filter(Boolean))).sort((left, right) => String(left).localeCompare(String(right))) as string[];
  const today = logs.filter((log) => new Date(log.created_at).toDateString() === new Date().toDateString()).length;
  const adminActions = logs.filter((log) => log.user_role === 'admin').length;
  const officerActions = logs.filter((log) => log.user_role === 'officer').length;

  function exportCsv() {
    const header = ['Date / Time', 'Actor', 'Email', 'Role', 'Action', 'Category', 'Target', 'Description', 'Status'];
    const rows = filtered.map((log) => [new Date(log.created_at).toLocaleString(), log.user_name, log.actor_email ?? '', log.user_role, log.action, log.category ?? '', log.target_name ?? '', log.description ?? '', log.status]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'aws-sbg-activity-logs.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice({ type: 'success', message: 'Activity logs exported.' });
  }

  if (role !== 'admin')
    return <p className="notice-error mt-4">Administrator rights are required for Activity Logs.</p>;
  const securityLogs = logs
    .filter((log) =>
      /admin|role|account|password|failed|deactivated|activated/i.test(
        log.action,
      ),
    )
    .slice(0, 4);

  return (
    <div className="admin-page activity-logs-page">
      <AdminNotice notice={notice} onDismiss={() => setNotice(null)} successTitle="Done" />
      <div className="admin-top-action">
        <button className="btn" onClick={exportCsv} disabled={!filtered.length}><Download className="size-4" /> Export Logs</button>
        <button className="btn-primary" onClick={() => void load()} disabled={busy}><RefreshCw className={`size-4 ${busy ? 'animate-spin' : ''}`} /> Refresh</button>
      </div>
      <section className="admin-metrics four">
        <Metric icon={<FileText />} label="Total Logs" value={logs.length} />
        <Metric icon={<Clock3 />} label="Today's Activity" value={today} />
        <Metric icon={<ShieldCheck />} label="Admin Actions" value={adminActions} tone="green" />
        <Metric icon={<Users />} label="Officer Actions" value={officerActions} tone="violet" />
      </section>
      <article className="admin-panel">
        <header className="admin-panel-header">
          <h2>System Activity</h2>
          <div className="admin-filter-row">
            <label className="admin-search">
              <Search className="size-4" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search user or action..." />
            </label>
            <select value={actor} onChange={(event) => setActor(event.target.value)}>
              <option value="">All Actors</option>
              {actors.map((value) => <option key={value}>{value}</option>)}
            </select>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All Categories</option>
              {categories.map((value) => <option key={value}>{value.replaceAll('_', ' ')}</option>)}
            </select>
            <select value={action} onChange={(event) => setAction(event.target.value)}>
              <option value="">All Actions</option>
              {actions.map((value) => <option key={value}>{value}</option>)}
            </select>
            <select value={actorRole} onChange={(event) => setActorRole(event.target.value)}>
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="officer">Officer</option>
            </select>
            <select value={range} onChange={(event) => setRange(event.target.value)}>
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </div>
        </header>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead><tr><th>Time</th><th>Actor</th><th>Role</th><th>Action</th><th>Target</th><th>Category</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                  <td>{log.user_name}</td>
                  <td className="capitalize">{log.user_role}</td>
                  <td title={log.description}>{log.action.replaceAll('_', ' ')}</td>
                  <td>{log.target_name || '—'}</td>
                  <td className="capitalize">{(log.category || 'members').replaceAll('_', ' ')}</td>
                  <td><span className={`admin-status ${log.status.toLowerCase() === 'success' ? 'active' : 'disabled'}`}><i />{log.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
      <article className="admin-panel security-events">
        <header><h2>Recent Security Events</h2></header>
        <div>
          {securityLogs.map((log) => (
            <section key={log.id}>
              <strong>{log.action}</strong>
              <p>{log.user_name}</p>
              <small>{new Date(log.created_at).toLocaleString()}</small>
            </section>
          ))}
          {!securityLogs.length && <p className="text-sm text-slate-500">No security events recorded yet.</p>}
        </div>
      </article>
    </div>
  );
}

function Metric({ icon, label, value, tone = 'cyan' }: { icon: React.ReactNode; label: string; value: number; tone?: string }) {
  return <article className={`admin-metric ${tone}`}><span>{icon}</span><div><p>{label}</p><strong>{value}</strong></div></article>;
}

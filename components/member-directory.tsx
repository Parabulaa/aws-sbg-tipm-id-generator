'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Archive, ShieldCheck, UserRoundCheck, UsersRound } from 'lucide-react';
import { useData } from './data-provider';
import { MemberForm } from './member-form';
import { StatusBadge } from './status-badge';
import { ImportMembers } from './import-members';
import { blankMember, statuses, displayName, validateMember } from '@/lib/domain';
import type { MemberRecord } from '@/lib/domain';
import { api, errorText } from '@/lib/client';
import { PrivateImage } from './private-image';
import { GenerationControls } from './generation-controls';

export function MemberDirectory() {
  const { members, refresh, role } = useData();
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [roleTeam, setRoleTeam] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [draft, setDraft] = useState({ ...blankMember });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [archived, setArchived] = useState<MemberRecord[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadArchived = useCallback(async () => {
    if (role !== 'admin') return;
    try {
      const rows = await api<MemberRecord[]>('members?archived=true');
      setArchived(rows.filter((member) => member.archived_at));
    } catch (caught) { setError(errorText(caught)); }
  }, [role]);
  useEffect(() => { queueMicrotask(() => { void loadArchived(); }); }, [loadArchived]);

  const courses = useMemo(() => [...new Set(members.map(member => member.program).filter(Boolean))].sort(), [members]);
  const years = useMemo(() => [...new Set(members.map(member => member.year_level).filter(Boolean))].sort(), [members]);
  const rolesAndTeams = useMemo(() => [...new Set(members.flatMap(member => [member.membership_type, member.team]).filter(Boolean))].sort(), [members]);
  const visible = members.filter((member) =>
    (!course || member.program === course) && (!year || member.year_level === year) &&
    (!roleTeam || member.membership_type === roleTeam || member.team === roleTeam) &&
    (!status || member.status === status) &&
    [displayName(member), member.tip_email, member.student_id_number, member.aws_sbg_id, member.officer_position, member.team]
      .join(' ').toLowerCase().includes(query.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(visible.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageRows = visible.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);
  const clearFilters = () => { setQuery(''); setCourse(''); setYear(''); setRoleTeam(''); setStatus(''); setPage(1); };
  const metrics = [
    { label: 'Total Members', value: members.length, icon: UsersRound },
    { label: 'Officers', value: members.filter(member => member.membership_type === 'Officer').length, icon: ShieldCheck },
    { label: 'Associates', value: members.filter(member => member.membership_type === 'Associate').length, icon: UserRoundCheck },
    { label: 'Archived', value: archived.length, icon: Archive },
  ];

  return <div className="mt-4 space-y-4">
    <div className="grid gap-4 xl:grid-cols-[minmax(280px,.65fr)_minmax(620px,1.35fr)]">
      <section className="grid grid-cols-2 gap-3" aria-label="Member statistics">
        {metrics.map(({ label, value, icon: Icon }) => <article key={label} className="flex min-h-28 items-center gap-3 rounded-xl border bg-white p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><Icon className="size-5" /></span>
          <div><p className="text-xs text-cyan-100/75">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>
        </article>)}
      </section>
      <section className="rounded-xl border bg-white p-4">
        <label className="field"><span className="sr-only">Search members</span><input type="search" value={query} placeholder="Search name, ID number, email, position…" onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Filter label="Course" value={course} setValue={(value) => { setCourse(value); setPage(1); }} options={courses} all="All courses" />
          <Filter label="Year Level" value={year} setValue={(value) => { setYear(value); setPage(1); }} options={years} all="All years" />
          <Filter label="Role / Team" value={roleTeam} setValue={(value) => { setRoleTeam(value); setPage(1); }} options={rolesAndTeams} all="All roles / teams" />
          <Filter label="Status" value={status} setValue={(value) => { setStatus(value); setPage(1); }} options={statuses} all="All statuses" />
        </div>
        <div className="member-action-grid mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <button className="btn member-action-button" onClick={() => setImporting(value => !value)}>{importing ? 'Close Import' : 'Import XLSX'}</button>
          <button className="btn member-action-button" onClick={() => setAdding(value => !value)}>{adding ? 'Cancel Add' : 'Add Member'}</button>
          {role === 'admin' && <button className="btn member-action-button" onClick={async () => { const next = !showArchived; setShowArchived(next); if (next) await loadArchived(); }}>{showArchived ? 'Hide Archived' : 'Show Archived'}</button>}
          <button className="btn-danger member-action-button" disabled={!selected.length || busy || role !== 'admin'} onClick={() => setDeleteOpen(true)}>Delete Selected</button>
          <GenerationControls selectedIds={selected} filteredIds={visible.map(member => member.id)} buttonClassName="member-action-button" />
          <button className="btn member-action-button" onClick={clearFilters}>Clear Filters</button>
        </div>
      </section>
    </div>

    {importing && <ImportMembers />}
    {adding && <form className="space-y-4 rounded-xl border bg-white p-4" onSubmit={async (event) => {
      event.preventDefault(); setError(''); const errors = validateMember(draft);
      if (errors.length) { setError(errors.join('; ')); return; }
      setBusy(true);
      try { await api('members', { method: 'POST', body: JSON.stringify({ members: [draft] }) }); await refresh(); setAdding(false); setDraft({ ...blankMember }); }
      catch (caught) { setError(errorText(caught)); } finally { setBusy(false); }
    }}><MemberForm value={draft} onChange={setDraft} disabled={busy} /><button className="btn-primary" disabled={busy}>Save Member</button></form>}
    {error && <p className="notice-error" role="alert">{error}</p>}

    <section className="overflow-hidden rounded-xl border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div><h2 className="font-semibold">Members ({visible.length})</h2><p className="text-xs text-slate-500">{selected.length} selected</p></div>
        <div className="flex items-center gap-2 text-sm"><button className="btn size-9 min-h-9 px-0" disabled={safePage === 1} onClick={() => setPage(value => Math.max(1, value - 1))}>‹</button><span>{safePage} of {totalPages}</span><button className="btn size-9 min-h-9 px-0" disabled={safePage === totalPages} onClick={() => setPage(value => Math.min(totalPages, value + 1))}>›</button></div>
      </div>
      <div className="overflow-auto"><table className="data-table">
        <thead><tr><th><input aria-label="Select page members" type="checkbox" checked={!!pageRows.length && pageRows.every(member => selected.includes(member.id))} onChange={(event) => setSelected(event.target.checked ? [...new Set([...selected, ...pageRows.map(member => member.id)])] : selected.filter(id => !pageRows.some(member => member.id === id)))} /></th>{['Photo', 'Name', 'ID Number', 'Role / Team', 'Type', 'Status', 'Validity', 'Action'].map(label => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>{pageRows.map(member => <tr key={member.id}>
          <td><input aria-label={`Select ${displayName(member)}`} type="checkbox" checked={selected.includes(member.id)} onChange={(event) => setSelected(event.target.checked ? [...new Set([...selected, member.id])] : selected.filter(id => id !== member.id))} /></td>
          <td>{member.photo_path ? <PrivateImage path={member.photo_path} alt="" className="size-10 rounded-full object-cover" /> : <span className="text-xs text-slate-500">Missing</span>}</td>
          <td className="min-w-44"><p className="font-medium">{displayName(member)}</p><p className="text-xs text-slate-500">{member.tip_email}</p></td>
          <td className="whitespace-nowrap">{member.aws_sbg_id}</td>
          <td className="min-w-40">{member.officer_position || member.membership_type}<br /><span className="text-xs text-slate-500">{member.team}</span></td>
          <td>{member.membership_type}</td><td><StatusBadge status={member.status} /></td><td className="whitespace-nowrap">{member.valid_until ?? 'Not issued'}</td>
          <td><div className="flex gap-2"><Link className="btn whitespace-nowrap" href={`/generate-id?member=${member.id}`}>Review / Edit ID</Link><button className="btn" aria-label={`Archive ${displayName(member)}`} disabled={busy} onClick={async () => { if (!window.confirm(`Archive ${displayName(member)}?`)) return; setBusy(true); try { await api(`members/${member.id}/archive`, { method: 'POST', body: JSON.stringify({ revision: member.revision }) }); await refresh(); await loadArchived(); } catch (caught) { setError(errorText(caught)); } finally { setBusy(false); } }}>Archive</button></div></td>
        </tr>)}</tbody>
      </table></div>
      {!visible.length && <p className="p-8 text-center text-slate-500">{members.length ? 'No members match these filters.' : 'No members imported yet.'}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
        <span>Showing {visible.length ? (safePage - 1) * rowsPerPage + 1 : 0}–{Math.min(safePage * rowsPerPage, visible.length)} of {visible.length}</span>
        <label className="flex items-center gap-2">Rows per page<select className="rounded-lg border bg-transparent px-2 py-1" value={rowsPerPage} onChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(1); }}>{[10, 25, 50, 100].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      </div>
    </section>

    {showArchived && role === 'admin' && <section className="rounded-xl border bg-white p-4"><h2 className="font-semibold">Archived Members ({archived.length})</h2><div className="mt-3 grid gap-2 md:grid-cols-2">{archived.map(member => <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-medium">{displayName(member)}</p><p className="text-xs text-slate-500">{member.aws_sbg_id}</p></div><button className="btn" disabled={busy} onClick={async () => { setBusy(true); try { await api(`members/${member.id}/restore`, { method: 'POST', body: JSON.stringify({ revision: member.revision }) }); await refresh(); await loadArchived(); } catch (caught) { setError(errorText(caught)); } finally { setBusy(false); } }}>Restore</button></div>)}{!archived.length && <p className="text-sm text-slate-500">No archived members.</p>}</div></section>}

    {deleteOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <dialog open aria-modal="true" aria-labelledby="delete-members-title" aria-describedby="delete-members-description" className="relative m-0 w-full max-w-md rounded-xl border border-slate-700 bg-[#111827] p-5 text-slate-100 shadow-2xl">
        <h2 id="delete-members-title" className="text-lg font-semibold">Delete selected members?</h2>
        <p id="delete-members-description" className="mt-2 text-sm text-slate-300">Are you sure you want to delete the selected member(s)? This permanently removes {selected.length} record(s).</p>
        <div className="mt-5 flex justify-end gap-2"><button className="btn" disabled={busy} onClick={() => setDeleteOpen(false)}>Cancel</button><button className="btn-danger" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await api('members', { method: 'DELETE', body: JSON.stringify({ ids: selected }) }); setSelected([]); setDeleteOpen(false); await refresh(); await loadArchived(); } catch (caught) { setError(errorText(caught)); } finally { setBusy(false); } }}>Delete</button></div>
      </dialog>
    </div>}
  </div>;
}

function Filter({ label, value, setValue, options, all }: { label: string; value: string; setValue: (value: string) => void; options: readonly string[]; all: string }) {
  return <label className="field">{label}<select value={value} onChange={(event) => setValue(event.target.value)}><option value="">{all}</option>{options.map(option => <option key={option}>{option}</option>)}</select></label>;
}

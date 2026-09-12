'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Archive, Check, Loader2, Search, ShieldCheck, UserRoundCheck, UsersRound } from 'lucide-react';
import { useData } from './data-provider';
import { MemberForm } from './member-form';
import { StatusBadge } from './status-badge';
import { ImportMembers } from './import-members';
import { blankMember, statuses, displayName, validateMember } from '@/lib/domain';
import type { MemberRecord } from '@/lib/domain';
import { api, errorText } from '@/lib/client';
import { PrivateImage } from './private-image';
import { GenerationControls } from './generation-controls';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Toaster, toast } from '@/components/ui/toast';

type BusyAction = '' | 'add' | 'delete' | 'restore' | 'archive';

export function MemberDirectory() {
  const { members, refresh, role } = useData();
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [roleTeam, setRoleTeam] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [draft, setDraft] = useState({ ...blankMember });
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [busy, setBusy] = useState<BusyAction>('');
  const [archived, setArchived] = useState<MemberRecord[]>([]);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [archivedQuery, setArchivedQuery] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
   const [archiveTarget, setArchiveTarget] = useState<MemberRecord | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const notify = useCallback((title: string, type: 'success' | 'error' = 'success') => {
    toast.add({ title, type, timeout: 3200 });
  }, []);

  const loadArchived = useCallback(async () => {
    if (role !== 'admin') return;
    try {
      const rows = await api<MemberRecord[]>('members?archived=true');
      setArchived(rows.filter((member) => member.archived_at));
    } catch (caught) {
      const message = errorText(caught);
      setError(message);
      notify(message, 'error');
    }
  }, [role, notify]);
  useEffect(() => { queueMicrotask(() => { void loadArchived(); }); }, [loadArchived]);

  const courses = useMemo(() => [...new Set(members.map(member => member.program).filter(Boolean))].sort(), [members]);
  const years = useMemo(() => [...new Set(members.map(member => member.year_level).filter(Boolean))].sort(), [members]);
  const rolesAndTeams = useMemo(() => [...new Set(members.flatMap(member => [member.membership_type, member.team]).filter(Boolean))].sort(), [members]);
  const visible = members.filter((member) => (!course || member.program === course) && (!year || member.year_level === year) && (!roleTeam || member.membership_type === roleTeam || member.team === roleTeam) && (!status || member.status === status) && [displayName(member), member.tip_email, member.student_id_number, member.aws_sbg_id, member.officer_position, member.team].join(' ').toLowerCase().includes(query.toLowerCase()));
  const filteredArchived = archived.filter((member) => [displayName(member), member.aws_sbg_id, member.membership_type, member.officer_position, member.team].join(' ').toLowerCase().includes(archivedQuery.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(visible.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageRows = visible.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);
  const allPageSelected = !!pageRows.length && pageRows.every(member => selected.includes(member.id));
  const clearFilters = () => { setQuery(''); setCourse(''); setYear(''); setRoleTeam(''); setStatus(''); setPage(1); };
  const metrics = [
    { label: 'Total Members', value: members.length, icon: UsersRound },
    { label: 'Officers', value: members.filter(member => member.membership_type === 'Officer').length, icon: ShieldCheck },
    { label: 'Associates', value: members.filter(member => member.membership_type === 'Associate').length, icon: UserRoundCheck },
    { label: 'Archived', value: archived.length, icon: Archive },
  ];

  async function addMember() {
    setModalError('');
    const validation = validateMember(draft);
    if (validation.length) { setModalError(validation.join('; ')); return; }
    setBusy('add');
    try {
      await api('members', { method: 'POST', body: JSON.stringify({ members: [draft] }) });
      await refresh(); setDraft({ ...blankMember }); setAddOpen(false); notify('Member added');
    } catch (caught) { setModalError(errorText(caught)); }
    finally { setBusy(''); }
  }

  async function restoreMember(member: MemberRecord) {
    setBusy('restore'); setModalError('');
    try {
      await api(`members/${member.id}/restore`, { method: 'POST', body: JSON.stringify({ revision: member.revision }) });
      await Promise.all([refresh(), loadArchived()]); notify('Member restored');
    } catch (caught) { const message = errorText(caught); setModalError(message); notify(message, 'error'); }
    finally { setBusy(''); }
  }

  async function archiveMember() {
    if (!archiveTarget) return;
    setBusy('archive'); setModalError('');
    try {
      await api(`members/${archiveTarget.id}/archive`, { method: 'POST', body: JSON.stringify({ revision: archiveTarget.revision }) });
      await Promise.all([refresh(), loadArchived()]); setArchiveTarget(null); notify('Member archived');
    } catch (caught) { setModalError(errorText(caught)); }
    finally { setBusy(''); }
  }

  async function deleteSelected() {
    if (!selected.length) return;
    setBusy('delete'); setModalError('');
    try {
      await api('members', { method: 'DELETE', body: JSON.stringify({ ids: selected }) });
      setSelected([]); setDeleteOpen(false); await Promise.all([refresh(), loadArchived()]); notify('Members deleted');
    } catch (caught) { setModalError(errorText(caught)); }
    finally { setBusy(''); }
  }

  return <Toaster><div className="mt-4 space-y-4">
    <div className="grid gap-4 xl:grid-cols-[minmax(280px,.65fr)_minmax(620px,1.35fr)]">
      <section className="grid grid-cols-2 gap-3" aria-label="Member statistics">
        {metrics.map(({ label, value, icon: Icon }) => <article key={label} className="member-metric-card flex min-h-28 items-center gap-3 rounded-xl border bg-white p-4"><span className="grid size-10 shrink-0 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><Icon className="size-5" /></span><div><p className="text-xs text-cyan-100/75">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div></article>)}
      </section>
      <section className="rounded-xl border bg-white p-4">
        <label className="field member-search"><span className="sr-only">Search members</span><Search className="size-4" /><input type="search" value={query} placeholder="Search name, ID number, email, position…" onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Filter label="Course" value={course} setValue={(value) => { setCourse(value); setPage(1); }} options={courses} all="All courses" /><Filter label="Year Level" value={year} setValue={(value) => { setYear(value); setPage(1); }} options={years} all="All years" /><Filter label="Role / Team" value={roleTeam} setValue={(value) => { setRoleTeam(value); setPage(1); }} options={rolesAndTeams} all="All roles / teams" /><Filter label="Status" value={status} setValue={(value) => { setStatus(value); setPage(1); }} options={statuses} all="All statuses" /></div>
        <div className="member-action-grid mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <button className="btn member-action-button" onClick={() => setImporting(value => !value)}>{importing ? 'Close Import' : 'Import XLSX'}</button>
          <button className="btn member-action-button" onClick={() => { setModalError(''); setAddOpen(true); }}>Add Member</button>
          {role === 'admin' && <button className="btn member-action-button" onClick={async () => { setArchivedOpen(true); await loadArchived(); }}>Show Archived</button>}
          <button className="btn-danger member-action-button" disabled={!selected.length || !!busy || role !== 'admin'} onClick={() => { setModalError(''); setDeleteOpen(true); }}>Delete Selected</button>
          <GenerationControls selectedIds={selected} filteredIds={visible.map(member => member.id)} buttonClassName="member-action-button" onNotify={notify} />
          <button className="btn member-action-button" onClick={clearFilters}>Clear Filters</button>
        </div>
      </section>
    </div>
    {importing && <ImportMembers onImported={(count) => notify(`${count} member${count === 1 ? '' : 's'} imported`)} />}
    {error && <p className="notice-error" role="alert">{error}</p>}

    <section className="overflow-hidden rounded-xl border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"><div><h2 className="font-semibold">Members ({visible.length})</h2><p className="text-xs text-slate-500">{selected.length} selected</p></div><div className="flex items-center gap-2 text-sm"><button className="btn size-9 min-h-9 px-0" aria-label="Previous page" disabled={safePage === 1} onClick={() => setPage(value => Math.max(1, value - 1))}>‹</button><span>{safePage} of {totalPages}</span><button className="btn size-9 min-h-9 px-0" aria-label="Next page" disabled={safePage === totalPages} onClick={() => setPage(value => Math.min(totalPages, value + 1))}>›</button></div></div>
      <div className="overflow-auto"><table className="data-table member-table"><thead><tr><th><MemberCheckbox label="Select page members" checked={allPageSelected} onChange={(checked) => setSelected(checked ? [...new Set([...selected, ...pageRows.map(member => member.id)])] : selected.filter(id => !pageRows.some(member => member.id === id)))} /></th>{['Photo', 'Name', 'ID Number', 'Role / Team', 'Type', 'Status', 'Validity', 'Action'].map(label => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>{pageRows.map(member => { const isSelected = selected.includes(member.id); return <tr key={member.id} data-selected={isSelected || undefined}><td><MemberCheckbox label={`Select ${displayName(member)}`} checked={isSelected} onChange={(checked) => setSelected(checked ? [...new Set([...selected, member.id])] : selected.filter(id => id !== member.id))} /></td><td>{member.photo_path ? <PrivateImage path={member.photo_path} alt="" className="size-10 rounded-full object-cover" /> : <span className="text-xs text-slate-500">Missing</span>}</td><td className="min-w-44"><p className="font-medium">{displayName(member)}</p><p className="text-xs text-slate-500">{member.tip_email}</p></td><td className="whitespace-nowrap">{member.aws_sbg_id}</td><td className="min-w-40">{member.officer_position || member.membership_type}<br /><span className="text-xs text-slate-500">{member.team}</span></td><td>{member.membership_type}</td><td><StatusBadge status={member.status} /></td><td className="whitespace-nowrap">{member.valid_until ?? 'Not issued'}</td><td><div className="flex gap-2"><Link className="btn whitespace-nowrap" href={`/generate-id?member=${member.id}`}>Review / Edit ID</Link><button className="btn" aria-label={`Archive ${displayName(member)}`} disabled={!!busy} onClick={() => { setModalError(''); setArchiveTarget(member); }}>Archive</button></div></td></tr>; })}</tbody>
      </table></div>
      {!visible.length && <p className="p-8 text-center text-slate-500">{members.length ? 'No members match these filters.' : 'No members imported yet.'}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500"><span>Showing {visible.length ? (safePage - 1) * rowsPerPage + 1 : 0}–{Math.min(safePage * rowsPerPage, visible.length)} of {visible.length}</span><label className="flex items-center gap-2">Rows per page<select className="rounded-lg border bg-transparent px-2 py-1" value={rowsPerPage} onChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(1); }}>{[10, 25, 50, 100].map(value => <option key={value} value={value}>{value}</option>)}</select></label></div>
    </section>

    <Dialog open={addOpen} onOpenChange={(open) => { if (!busy) { setAddOpen(open); setModalError(''); } }}><DialogContent className="member-dialog sm:max-w-2xl"><DialogHeader><DialogTitle>Add Member</DialogTitle><DialogDescription>Create a new organization member.</DialogDescription></DialogHeader><form id="add-member-form" onSubmit={(event) => { event.preventDefault(); void addMember(); }}><MemberForm value={draft} onChange={setDraft} disabled={!!busy} />{modalError && <p className="notice-error mt-4" role="alert">{modalError}</p>}</form><DialogFooter><button className="btn" type="button" disabled={!!busy} onClick={() => setAddOpen(false)}>Cancel</button><button className="btn-primary" type="submit" form="add-member-form" disabled={!!busy}>{busy === 'add' ? <><Loader2 className="size-4 animate-spin" /> Adding...</> : 'Add Member'}</button></DialogFooter></DialogContent></Dialog>

    <Dialog open={archivedOpen} onOpenChange={(open) => { if (!busy) { setArchivedOpen(open); setModalError(''); } }}><DialogContent className="member-dialog member-archive-dialog sm:max-w-5xl"><DialogHeader><DialogTitle>Archived Members</DialogTitle><DialogDescription>View or restore archived member records.</DialogDescription></DialogHeader><label className="field member-search"><span className="sr-only">Search archived members</span><Search className="size-4" /><input type="search" value={archivedQuery} placeholder="Search archived members..." onChange={(event) => setArchivedQuery(event.target.value)} /></label><div className="max-h-[55vh] overflow-auto rounded-lg border border-cyan-200/15"><table className="data-table member-table"><thead><tr>{['Name', 'ID', 'Membership Type', 'Team / Role', 'Archived', 'Action'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{filteredArchived.map(member => <tr key={member.id} className="member-archived-row"><td><strong>{displayName(member)}</strong><br /><span className="text-xs text-slate-500">{member.tip_email}</span></td><td>{member.aws_sbg_id}</td><td>{member.membership_type}</td><td>{member.officer_position || member.team || '—'}</td><td>{member.archived_at ? new Date(member.archived_at).toLocaleDateString() : '—'}</td><td><button className="btn" disabled={!!busy} onClick={() => void restoreMember(member)}>{busy === 'restore' ? <><Loader2 className="size-4 animate-spin" /> Restoring...</> : 'Restore'}</button></td></tr>)}</tbody></table>{!filteredArchived.length && <div className="p-10 text-center text-sm text-slate-400">{archived.length ? 'No archived members match your search.' : 'No archived members.'}</div>}</div>{modalError && <p className="notice-error" role="alert">{modalError}</p>}<DialogFooter><button className="btn" disabled={!!busy} onClick={() => setArchivedOpen(false)}>Close</button></DialogFooter></DialogContent></Dialog>

    <Dialog open={deleteOpen} onOpenChange={(open) => { if (!busy) { setDeleteOpen(open); setModalError(''); } }}><DialogContent className="member-dialog sm:max-w-md"><DialogHeader><DialogTitle>Delete selected members?</DialogTitle><DialogDescription>You are about to delete {selected.length} selected record{selected.length === 1 ? '' : 's'}. This action cannot be undone.</DialogDescription></DialogHeader>{modalError && <p className="notice-error" role="alert">{modalError}</p>}<DialogFooter><button className="btn" disabled={!!busy} onClick={() => setDeleteOpen(false)}>Cancel</button><button className="btn-danger" disabled={!!busy || !selected.length} onClick={() => void deleteSelected()}>{busy === 'delete' ? <><Loader2 className="size-4 animate-spin" /> Deleting...</> : 'Delete'}</button></DialogFooter></DialogContent></Dialog>

    <Dialog open={!!archiveTarget} onOpenChange={(open) => { if (!open && !busy) { setArchiveTarget(null); setModalError(''); } }}><DialogContent className="member-dialog sm:max-w-md"><DialogHeader><DialogTitle>Archive member?</DialogTitle><DialogDescription>{archiveTarget ? `${displayName(archiveTarget)} will move to Archived Members and can be restored later.` : ''}</DialogDescription></DialogHeader>{modalError && <p className="notice-error" role="alert">{modalError}</p>}<DialogFooter><button className="btn" disabled={!!busy} onClick={() => setArchiveTarget(null)}>Cancel</button><button className="btn-primary" disabled={!!busy} onClick={() => void archiveMember()}>{busy === 'archive' ? <><Loader2 className="size-4 animate-spin" /> Archiving...</> : 'Archive'}</button></DialogFooter></DialogContent></Dialog>
  </div></Toaster>;
}

function Filter({ label, value, setValue, options, all }: { label: string; value: string; setValue: (value: string) => void; options: readonly string[]; all: string }) {
  return <label className="field">{label}<select value={value} onChange={(event) => setValue(event.target.value)}><option value="">{all}</option>{options.map(option => <option key={option}>{option}</option>)}</select></label>;
}

function MemberCheckbox({ label, checked, onChange, disabled = false }: { label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return <label className="member-checkbox"><input type="checkbox" aria-label={label} checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /><span aria-hidden="true"><Check /></span></label>;
}

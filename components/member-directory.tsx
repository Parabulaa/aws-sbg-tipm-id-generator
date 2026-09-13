'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Archive, Check, ChevronLeft, ChevronRight, FilterX, Loader2, Search, ShieldCheck, Trash2, Upload, UserRoundPlus, UserRoundCheck, UsersRound } from 'lucide-react';
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
  const searchParams = useSearchParams();
  const { members, refresh, role } = useData();
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [roleTeam, setRoleTeam] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(() => searchParams.get('add') === '1');
  const [importing, setImporting] = useState(() => searchParams.get('import') === '1');
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
    try {
      const rows = await api<MemberRecord[]>('members?archived=true');
      setArchived(rows.filter((member) => member.archived_at));
    } catch (caught) {
      const message = errorText(caught);
      setError(message);
      notify(message, 'error');
    }
  }, [notify]);
  useEffect(() => { queueMicrotask(() => { void loadArchived(); }); }, [loadArchived]);

  const courses = useMemo(() => [...new Set(members.map(member => member.program).filter(Boolean))].sort(), [members]);
  const years = useMemo(() => [...new Set(members.map(member => member.year_level).filter(Boolean))].sort(), [members]);
  const rolesAndTeams = useMemo(() => [...new Set(members.flatMap(member => [member.membership_type, member.team]).filter(Boolean))].sort(), [members]);
  const visible = members.filter((member) => (!course || member.program === course) && (!year || member.year_level === year) && (!roleTeam || member.membership_type === roleTeam || member.team === roleTeam) && (!status || member.status === status) && [displayName(member), member.tip_email, member.student_id_number, member.aws_sbg_id, member.officer_position, member.team].join(' ').toLowerCase().includes(query.toLowerCase()));
  const filteredArchived = archived.filter((member) => [displayName(member), member.aws_sbg_id, member.membership_type, member.officer_position, member.team].join(' ').toLowerCase().includes(archivedQuery.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(visible.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageRows = visible.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);
  const pageNumbers = useMemo(() => {
    const candidates = new Set([1, safePage - 1, safePage, safePage + 1, totalPages]);
    return [...candidates]
      .filter((value) => value >= 1 && value <= totalPages)
      .sort((a, b) => a - b);
  }, [safePage, totalPages]);
  const allPageSelected = !!pageRows.length && pageRows.every(member => selected.includes(member.id));
  const clearFilters = () => { setQuery(''); setCourse(''); setYear(''); setRoleTeam(''); setStatus(''); setPage(1); };
  const metrics = [
    { label: 'Total Members', value: members.length, note: 'All registered members', icon: UsersRound },
    { label: 'Officers', value: members.filter(member => member.membership_type === 'Officer').length, note: `${members.length ? Math.round((members.filter(member => member.membership_type === 'Officer').length / members.length) * 100) : 0}% of total`, icon: ShieldCheck },
    { label: 'Associates', value: members.filter(member => member.membership_type === 'Associate').length, note: `${members.length ? Math.round((members.filter(member => member.membership_type === 'Associate').length / members.length) * 100) : 0}% of total`, icon: UserRoundCheck },
    { label: 'Archived', value: archived.length, note: `${members.length ? Math.round((archived.length / members.length) * 100) : 0}% of total`, icon: Archive },
  ];

  async function addMember() {
    setModalError('');
    const validation = validateMember(draft);
    if (validation.length) { setModalError(validation.join('; ')); return; }
    setBusy('add');
    try {
      await api('members', { method: 'POST', body: JSON.stringify({ members: [draft] }) });
      await refresh(); setDraft({ ...blankMember }); setAddOpen(false); notify('Member added');
    } catch (caught) { const message = errorText(caught); setModalError(message); notify(message, 'error'); }
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

  return <Toaster><div className="members-page mt-4 space-y-4">
    <section className="members-metrics" aria-label="Member statistics">
      {metrics.map(({ label, value, note, icon: Icon }) => (
        <article key={label} className="member-metric-card">
          <span><Icon className="size-5" /></span>
          <div>
            <p>{label}</p>
            <strong>{value}</strong>
            <small>{note}</small>
          </div>
        </article>
      ))}
    </section>
    <section className="members-filter-panel">
      <label className="field member-search members-search"><span className="sr-only">Search members</span><Search className="size-4" /><input type="search" value={query} placeholder="Search members..." onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
      <div className="members-filter-grid"><Filter label="Course" value={course} setValue={(value) => { setCourse(value); setPage(1); }} options={courses} all="All courses" /><Filter label="Year Level" value={year} setValue={(value) => { setYear(value); setPage(1); }} options={years} all="All years" /><Filter label="Role / Team" value={roleTeam} setValue={(value) => { setRoleTeam(value); setPage(1); }} options={rolesAndTeams} all="All roles / teams" /><Filter label="Status" value={status} setValue={(value) => { setStatus(value); setPage(1); }} options={statuses} all="All statuses" /></div>
      <div className="member-action-grid">
        <button className="btn-primary member-action-button" onClick={() => setImporting(true)}><Upload className="size-4" /> Import XLSX</button>
        <button className="btn member-action-button" onClick={() => { setModalError(''); setAddOpen(true); }}><UserRoundPlus className="size-4" /> Add Member</button>
        <button className="btn member-action-button" onClick={async () => { setArchivedOpen(true); await loadArchived(); }}><Archive className="size-4" /> Show Archived</button>
        <button className="btn member-action-button" onClick={clearFilters}><FilterX className="size-4" /> Clear Filters</button>
        <GenerationControls selectedIds={selected} filteredIds={visible.map(member => member.id)} buttonClassName="member-action-button" onNotify={notify} />
        <button className="btn-danger member-action-button" disabled={!selected.length || !!busy || role !== 'admin'} onClick={() => { setModalError(''); setDeleteOpen(true); }}><Trash2 className="size-4" /> Delete Selected</button>
      </div>
      </section>
    {error && <p className="notice-error" role="alert">{error}</p>}

    <section className="members-table-card">
      <div className="members-table-header"><div><h2>Members ({visible.length})</h2><p>{selected.length} selected</p></div><div><button aria-label="Previous page" disabled={safePage === 1} onClick={() => setPage(value => Math.max(1, value - 1))}><ChevronLeft /></button><span>{safePage} of {totalPages}</span><button aria-label="Next page" disabled={safePage === totalPages} onClick={() => setPage(value => Math.min(totalPages, value + 1))}><ChevronRight /></button></div></div>
      <div className="members-table-scroll"><table className="data-table member-table"><thead><tr><th><MemberCheckbox label="Select page members" checked={allPageSelected} onChange={(checked) => setSelected(checked ? [...new Set([...selected, ...pageRows.map(member => member.id)])] : selected.filter(id => !pageRows.some(member => member.id === id)))} /></th>{['Photo', 'Name', 'ID Number', 'Role / Team', 'Type', 'Status', 'Validity', 'Action'].map(label => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>{pageRows.map(member => { const isSelected = selected.includes(member.id); return <tr key={member.id} data-selected={isSelected || undefined}><td><MemberCheckbox label={`Select ${displayName(member)}`} checked={isSelected} onChange={(checked) => setSelected(checked ? [...new Set([...selected, member.id])] : selected.filter(id => id !== member.id))} /></td><td>{member.photo_path ? <PrivateImage path={member.photo_path} alt="" className="member-photo" /> : <span className="member-photo-fallback">{displayName(member).split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()}</span>}</td><td className="member-name-cell"><p>{displayName(member)}</p><small>{member.tip_email}</small></td><td className="member-id-cell">{member.aws_sbg_id}</td><td className="member-role-cell">{member.officer_position || member.team || member.program || member.membership_type}</td><td>{member.membership_type}</td><td><StatusBadge status={member.status} /></td><td className="member-validity-cell">{member.valid_until ?? 'Not issued'}</td><td><div className="member-row-actions"><Link className="btn" href={`/generate-id?member=${member.id}`}>Review / Edit ID</Link><button className="btn" aria-label={`Archive ${displayName(member)}`} disabled={!!busy} onClick={() => { setModalError(''); setArchiveTarget(member); }}>Archive</button></div></td></tr>; })}</tbody>
      </table></div>
      {!visible.length && <p className="p-8 text-center text-slate-500">{members.length ? 'No members match these filters.' : 'No members imported yet.'}</p>}
      <div className="members-pagination"><span>Showing {visible.length ? (safePage - 1) * rowsPerPage + 1 : 0}–{Math.min(safePage * rowsPerPage, visible.length)} of {visible.length}</span><div><label>Rows per page<select value={rowsPerPage} onChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(1); }}>{[5, 10, 25, 50, 100].map(value => <option key={value} value={value}>{value}</option>)}</select></label><button aria-label="Previous page" disabled={safePage === 1} onClick={() => setPage(value => Math.max(1, value - 1))}><ChevronLeft /></button>{pageNumbers.map((value, index) => <span key={value} className="contents">{index > 0 && value - pageNumbers[index - 1] > 1 ? <i>...</i> : null}<button className={value === safePage ? 'is-current' : ''} onClick={() => setPage(value)}>{value}</button></span>)}<button aria-label="Next page" disabled={safePage === totalPages} onClick={() => setPage(value => Math.min(totalPages, value + 1))}><ChevronRight /></button></div></div>
    </section>

    <Dialog open={importing} onOpenChange={setImporting}><DialogContent className="member-dialog member-import-dialog sm:max-w-4xl"><DialogHeader><DialogTitle>Import XLSX</DialogTitle><DialogDescription>Upload and validate a membership spreadsheet before adding records.</DialogDescription></DialogHeader><ImportMembers embedded onImported={(count) => { setImporting(false); notify(`${count} member${count === 1 ? '' : 's'} imported`); }} /><DialogFooter><button className="btn" onClick={() => setImporting(false)}>Close</button></DialogFooter></DialogContent></Dialog>

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

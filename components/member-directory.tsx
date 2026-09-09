/* oxlint-disable next/no-img-element -- Private authenticated and local object URLs must bypass image optimization. */
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useData } from './data-provider';
import { MemberForm } from './member-form';
import { StatusBadge } from './status-badge';
import { ImportMembers } from './import-members';
import {
  blankMember,
  categories,
  statuses,
  displayName,
  validateMember,
} from '@/lib/domain';
import { api, errorText } from '@/lib/client';
import { PrivateImage } from './private-image';
import { GenerationControls } from './generation-controls';
export function MemberDirectory() {
  const { members, refresh, role } = useData();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [team, setTeam] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ ...blankMember });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [archived, setArchived] = useState<
    import('@/lib/domain').MemberRecord[]
  >([]);
  const [showArchived, setShowArchived] = useState(false);
  const visible = members.filter(
    (member) =>
      (!category || member.membership_type === category) &&
      (!team || member.team === team) &&
      (!status || member.status === status) &&
      [
        displayName(member),
        member.tip_email,
        member.student_id_number,
        member.aws_sbg_id,
        member.officer_position,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div className="mt-6 space-y-6">
      <ImportMembers />
      <button className="btn" onClick={() => setAdding(!adding)}>
        {adding ? 'Cancel adding' : 'Add member manually'}
      </button>
      {role === 'admin' && (
        <button
          className="btn ml-2"
          onClick={async () => {
            const next = !showArchived;
            setShowArchived(next);
            if (next) {
              try {
                const rows = await api<import('@/lib/domain').MemberRecord[]>(
                  'members?archived=true',
                );
                setArchived(rows.filter((member) => member.archived_at));
              } catch (error) {
                setError(errorText(error));
              }
            }
          }}
        >
          {showArchived ? 'Hide archived members' : 'Show archived members'}
        </button>
      )}
      {adding && (
        <form
          className="rounded-2xl border bg-white p-5 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError('');
            const errors = validateMember(draft);
            if (errors.length) {
              setError(errors.join('; '));
              return;
            }
            setBusy(true);
            try {
              await api('members', {
                method: 'POST',
                body: JSON.stringify({ members: [draft] }),
              });
              await refresh();
              setAdding(false);
              setDraft({ ...blankMember });
            } catch (error) {
              setError(errorText(error));
            } finally {
              setBusy(false);
            }
          }}
        >
          <MemberForm value={draft} onChange={setDraft} disabled={busy} />
          <button className="btn-primary" disabled={busy}>
            Save member
          </button>
          {error && (
            <p className="notice-error" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="field">
            Search
            <input
              type="search"
              value={query}
              placeholder="Name, email, ID, position"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="field">
            Membership
            <select
              aria-label="Membership"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">All</option>
              {categories.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Team
            <select
              aria-label="Team"
              value={team}
              onChange={(event) => setTeam(event.target.value)}
            >
              <option value="">All teams</option>
              {[
                ...new Set(
                  members.map((member) => member.team).filter(Boolean),
                ),
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Status
            <select
              aria-label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              {statuses.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="px-4 pb-4">
          <GenerationControls
            selectedIds={selected}
            filteredIds={visible.map((member) => member.id)}
          />
        </div>
        <div className="overflow-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <input
                    aria-label="Select all visible members"
                    type="checkbox"
                    checked={
                      !!visible.length &&
                      visible.every((member) => selected.includes(member.id))
                    }
                    onChange={(event) =>
                      setSelected(
                        event.target.checked
                          ? [
                              ...new Set([
                                ...selected,
                                ...visible.map((member) => member.id),
                              ]),
                            ]
                          : selected.filter(
                              (id) =>
                                !visible.some((member) => member.id === id),
                            ),
                      )
                    }
                  />
                </th>
                {[
                  'Photo',
                  'Name',
                  'ID Number',
                  'Role / Team',
                  'Type',
                  'Status',
                  'Validity',
                  'Action',
                ].map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((member) => (
                <tr key={member.id}>
                  <td aria-label={`Selection for ${displayName(member)}`}>
                    <input
                      aria-label={`Select ${displayName(member)}`}
                      type="checkbox"
                      checked={selected.includes(member.id)}
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? [...selected, member.id]
                            : selected.filter((id) => id !== member.id),
                        )
                      }
                    />
                  </td>
                  <td>
                    {member.photo_path ? (
                      <PrivateImage
                        path={member.photo_path}
                        alt=""
                        className="size-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm">Missing</span>
                    )}
                  </td>
                  <td className="min-w-40 font-medium">
                    {displayName(member)}
                  </td>
                  <td>{member.aws_sbg_id}</td>
                  <td>
                    {member.officer_position || member.membership_type}
                    <br />
                    <span className="text-slate-500">{member.team}</span>
                  </td>
                  <td>{member.membership_type}</td>
                  <td>
                    <StatusBadge status={member.status} />
                  </td>
                  <td>{member.valid_until ?? 'Not issued'}</td>
                  <td aria-label={`Actions for ${displayName(member)}`}>
                    <div className="flex min-w-48 flex-wrap gap-2">
                      <Link
                        className="btn whitespace-nowrap"
                        href={`/generate-id?member=${member.id}`}
                      >
                        Review / Edit ID
                      </Link>
                      <button
                        className="btn"
                        disabled={busy}
                        onClick={async () => {
                          if (
                            !window.confirm(`Archive ${displayName(member)}?`)
                          )
                            return;
                          setBusy(true);
                          setError('');
                          try {
                            await api(`members/${member.id}/archive`, {
                              method: 'POST',
                              body: JSON.stringify({
                                revision: member.revision,
                              }),
                            });
                            await refresh();
                          } catch (error) {
                            setError(errorText(error));
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!visible.length && (
          <p className="p-8 text-center text-slate-600">
            {members.length
              ? 'No members match these filters.'
              : 'No members imported yet. Upload an XLSX file to begin.'}
          </p>
        )}
        <p className="p-4 text-sm text-slate-500">
          {visible.length} displayed · {selected.length} selected
        </p>
      </section>
      {showArchived && role === 'admin' && (
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Archived members</h2>
          <div className="mt-3 space-y-2">
            {archived.map((member) => (
              <div
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div>
                  <p className="font-medium">{displayName(member)}</p>
                  <p className="text-sm text-slate-500">{member.aws_sbg_id}</p>
                </div>
                <button
                  className="btn"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError('');
                    try {
                      await api(`members/${member.id}/restore`, {
                        method: 'POST',
                        body: JSON.stringify({ revision: member.revision }),
                      });
                      await refresh();
                      setArchived((items) =>
                        items.filter((item) => item.id !== member.id),
                      );
                    } catch (error) {
                      setError(errorText(error));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Restore
                </button>
              </div>
            ))}
            {!archived.length && (
              <p className="text-sm text-slate-500">No archived members.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useData } from './data-provider';
import { MemberForm } from './member-form';
import { PhotoEditor } from './photo-editor';
import { IDPreview } from './id-preview';
import { StatusBadge } from './status-badge';
import { GenerationControls } from './generation-controls';
import { displayName, validateMember } from '@/lib/domain';
import type { MemberRecord, Generation } from '@/lib/domain';
import { api, errorText } from '@/lib/client';
export function GenerateIdWorkspace() {
  const { members } = useData();
  const params = useSearchParams();
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const member =
    members.find(
      (member) => member.id === (selected || params.get('member')),
    ) || members[0];
  if (!member)
    return (
      <div className="mt-6 notice">
        No members imported yet.{' '}
        <Link className="underline" href="/members">
          Upload an XLSX file to begin.
        </Link>
      </div>
    );
  const index = members.findIndex((record) => record.id === member.id);
  return (
    <div className="mt-6 space-y-5">
      <section className="rounded-2xl border bg-white p-4">
        <label className="field">
          Search review queue
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, ID or email"
          />
        </label>
        <label className="field mt-3">
          Select member
          <select
            aria-label="Select member"
            value={member.id}
            onChange={(event) => {
              if (
                window.confirm('Switch members? Save any current edits first.')
              )
                setSelected(event.target.value);
            }}
          >
            {members
              .filter(
                (record) =>
                  record.id === member.id ||
                  [displayName(record), record.tip_email, record.aws_sbg_id]
                    .join(' ')
                    .toLowerCase()
                    .includes(query.toLowerCase()),
              )
              .map((record) => (
                <option key={record.id} value={record.id}>
                  {displayName(record)} — {record.aws_sbg_id} — {record.status}
                </option>
              ))}
          </select>
        </label>
        <p className="mt-3 text-sm">
          Member {index + 1} of {members.length}
        </p>
      </section>
      <ReviewEditor
        key={member.id}
        initial={member}
        previous={() => setSelected(members[Math.max(0, index - 1)].id)}
        next={() =>
          setSelected(members[Math.min(members.length - 1, index + 1)].id)
        }
        first={index === 0}
        last={index === members.length - 1}
      />
      <GenerationControls />
    </div>
  );
}
function ReviewEditor({
  initial,
  previous,
  next,
  first,
  last,
}: {
  initial: MemberRecord;
  previous: () => void;
  next: () => void;
  first: boolean;
  last: boolean;
}) {
  const { colors, templates, refresh } = useData();
  const [member, setMember] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState<string>();
  const [generation, setGeneration] = useState<Generation>();
  const dirty = JSON.stringify(member) !== JSON.stringify(saved);
  useEffect(() => {
    if (!dirty && initial.revision > saved.revision) {
      queueMicrotask(() => {
        setMember(initial);
        setSaved(initial);
      });
    }
  }, [initial, dirty, saved.revision]);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty || preview) {
        event.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, preview]);
  async function save() {
    if (preview) throw new Error('Apply the uploaded photo before saving.');
    if (!dirty) return member;
    const updated = await api<MemberRecord>(`members/${member.id}`, {
      method: 'PUT',
      body: JSON.stringify(member),
    });
    setMember(updated);
    setSaved(updated);
    await refresh();
    return updated;
  }
  async function act(label: string, operation: () => Promise<void>) {
    setBusy(label);
    setError('');
    setNotice('');
    try {
      await operation();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy('');
    }
  }
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="space-y-5 rounded-2xl border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{displayName(member)}</h2>
          <StatusBadge status={dirty ? 'Draft' : member.status} />
        </div>
        <fieldset disabled={!!busy} className="min-w-0 space-y-5">
          <MemberForm
            value={member}
            onChange={(value) => setMember({ ...member, ...value })}
          />
          <PhotoEditor
            key={member.id}
            member={member}
            onCrop={(crop) => setMember({ ...member, photo_crop_data: crop })}
            onPreview={setPreview}
            onMember={(updated) => {
              setMember((current) => ({
                ...current,
                photo_path: updated.photo_path,
                photo_crop_data: updated.photo_crop_data,
                revision: updated.revision,
                status: updated.status,
                updated_at: updated.updated_at,
              }));
              setSaved(updated);
              void refresh().catch((error) => setError(errorText(error)));
            }}
          />
          {member.membership_type === 'Officer' && (
            <div className="space-y-2">
              <label className="field">
                Officer accent override
                <input
                  type="color"
                  value={member.color_override || '#10b981'}
                  onChange={(event) =>
                    setMember({ ...member, color_override: event.target.value })
                  }
                />
              </label>
              <button
                className="btn"
                onClick={() => setMember({ ...member, color_override: null })}
              >
                Reset to assigned team color
              </button>
              <p className="text-sm text-slate-500">
                Team color mode and mappings are configured in Templates.
              </p>
            </div>
          )}
          {!!validateMember(member).length && (
            <p className="notice-error">{validateMember(member).join('; ')}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              className="btn"
              onClick={() =>
                void act('Saving information…', async () => {
                  await save();
                  setNotice('Information and photo position saved.');
                })
              }
            >
              Save information
            </button>
            <button
              className="btn-primary"
              disabled={
                !member.photo_path ||
                !!preview ||
                !!validateMember(member).length
              }
              onClick={() =>
                void act('Confirming ID…', async () => {
                  const updated = await save();
                  const confirmed = await api<MemberRecord>(
                    `members/${member.id}/confirm`,
                    {
                      method: 'POST',
                      body: JSON.stringify({ revision: updated.revision }),
                    },
                  );
                  setMember(confirmed);
                  setSaved(confirmed);
                  await refresh();
                  setNotice('ID confirmed and Ready for generation.');
                })
              }
            >
              Confirm ID
            </button>
          </div>
          <p className="text-sm text-slate-600">
            Confirm only after verifying the information, photo position, and
            both sides. Editing confirmed information requires confirmation
            again.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn"
              disabled={first}
              onClick={() => {
                if (
                  !(dirty || preview) ||
                  window.confirm(
                    'Discard unsaved changes and go to the previous member?',
                  )
                )
                  previous();
              }}
            >
              Previous
            </button>
            <button
              className="btn"
              disabled={last}
              onClick={() =>
                void act('Saving and moving to next member…', async () => {
                  await save();
                  next();
                })
              }
            >
              Save &amp; Next
            </button>
          </div>
        </fieldset>
        {busy && <output className="block">{busy}</output>}
        {notice && <output className="notice block">{notice}</output>}
        {error && (
          <p role="alert" className="notice-error">
            {error}
          </p>
        )}
      </section>
      <section className="min-w-0 space-y-4">
        <IDPreview
          member={member}
          templates={templates}
          colors={colors}
          photoOverride={preview}
        />
        <button
          className="btn-primary"
          disabled={
            !!busy ||
            dirty ||
            !!preview ||
            !['Ready', 'Generated'].includes(member.status)
          }
          onClick={() =>
            void act('Generating front PNG…', async () => {
              let current = member;
              if (current.status === 'Generated') {
                if (
                  !window.confirm(
                    'Confirm this information and photo again before regenerating?',
                  )
                )
                  return;
                current = await api<MemberRecord>(
                  `members/${member.id}/confirm`,
                  {
                    method: 'POST',
                    body: JSON.stringify({ revision: member.revision }),
                  },
                );
                setMember(current);
                setSaved(current);
              }
              const { generateMember } = await import('@/lib/export-id');
              const result = await generateMember(
                current,
                templates,
                colors,
                'front',
              );
              setGeneration(result);
              const updated = {
                ...current,
                status: 'Generated' as const,
                revision: current.revision + 1,
              };
              setMember(updated);
              setSaved(updated);
              await refresh();
              setNotice('ID files generated and saved in history.');
            })
          }
        >
          {member.status === 'Generated'
            ? 'Regenerate Front ID'
            : 'Generate Front ID'}
        </button>
        {generation && (
          <div className="flex flex-wrap gap-2">
            {(
              [['front.png', generation.front_path]] as const
            ).map(([file, path]) => (
              <button
                className="btn"
                key={file}
                disabled={!!busy}
                onClick={() =>
                  void act('Preparing download…', async () => {
                    const { downloadFile } = await import('@/lib/export-id');
                    if (!path)
                      throw new Error('Generated file reference is missing.');
                    await downloadFile(path, `${member.aws_sbg_id}_${file}`);
                  })
                }
              >
                Download{' '}
                Front PNG
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

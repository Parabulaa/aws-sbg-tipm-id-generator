/* oxlint-disable next/no-img-element -- Private authenticated and local object URLs must bypass image optimization. */
'use client';
import { useEffect, useState } from 'react';
import { useData } from './data-provider';
import { api, errorText } from '@/lib/client';
import { categories } from '@/lib/domain';
import { PrivateImage } from './private-image';
import { officerDesigns } from '@/lib/templates';
import type { Template } from '@/lib/templates';
export function TemplateSettings() {
  const { templates, refresh, role } = useData();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState('Member');
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [officers, setOfficers] = useState<OfficerAccess[]>([]);
  useEffect(() => {
    if (role !== 'admin') return;
    void api<OfficerAccess[]>('officers')
      .then(setOfficers)
      .catch(() => {});
  }, [role]);
  return (
    <div className="mt-6 space-y-6">
      <p className="notice">
        Use approved 1200 × 1950 PNG backgrounds with matching field
        coordinates. Front designs need a mapping JSON; completed back designs
        only need their PNG.
      </p>
      <p className="notice">
        After saving a template, open <strong>Generate ID</strong>, select a
        member, and the composited front preview will use this background,
        photo, ID number, and mapped fields before you generate the PNG.
      </p>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Officer designs</h2>
        <p className="text-sm text-slate-600">Upload each office’s approved artwork separately. Front and back previews show the saved backgrounds.</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {officerDesigns.map(design => (
            <article key={design.team} className="rounded-2xl border bg-white p-4">
              <h3 className="font-semibold">{design.label}</h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {(['front', 'back'] as const).map(side => (
                  <TemplateBackground key={side} side={side} label={design.label}
                    template={templates.find(t => t.category === 'Officer' && t.team === design.team && t.side === side)} />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="space-y-4">
      <h2 className="text-xl font-semibold">Member front and back</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {(['front', 'back'] as const).map(side => (
          <div key={side} className="rounded-2xl border bg-white p-4">
            <TemplateBackground side={side} label="Member"
              template={templates.find(t => t.category === 'Member' && !t.team && t.side === side)} />
          </div>
        ))}
      </div>
      </section>
      {role === 'admin' ? (
        <details className="rounded-2xl border bg-white p-5">
          <summary className="cursor-pointer font-semibold">
            Configure an approved template
          </summary>
          <p className="mt-3 text-sm text-slate-600">
            Initial setup: upload the approved PNG and its coordinate mapping
            JSON. This replaces the selected side. Keep text, logos, and fixed
            graphics outside colorable regions. Review each output before
            confirming members.
          </p>
          <form
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const mapping = form.get('mapping');
              setError('');
              setMessage('');
              setBusy(true);
              try {
                if (side === 'front' && !(mapping instanceof File))
                  throw new Error('Choose the field mapping JSON.');
                form.set(
                  'layout',
                  side === 'front'
                    ? await (mapping as File).text()
                    : JSON.stringify({ fields: [], accents: [] }),
                );
                form.delete('mapping');
                await api('templates', { method: 'POST', body: form });
                await refresh();
                setMessage('Approved template saved.');
              } catch (error) {
                setError(errorText(error));
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="field">
              Membership
              <select name="category" aria-label="Membership" value={category} onChange={event => setCategory(event.target.value)}>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            {category === 'Officer' && (
              <label className="field">
                Officer design
                <select name="team" aria-label="Officer design">
                  {officerDesigns.map(design => <option key={design.team} value={design.team}>{design.label}</option>)}
                </select>
              </label>
            )}
            <label className="field">
              Side
              <select name="side" aria-label="Side" value={side} onChange={event => setSide(event.target.value as 'front' | 'back')}>
                <option value="front">Front</option>
                <option value="back">Back</option>
              </select>
            </label>
            <label className="field">
              Approved PNG
              <input name="image" type="file" accept="image/png" required />
            </label>
            {side === 'front' && (
              <label className="field">
                Front field mapping JSON
                <input name="mapping" type="file" accept=".json" required />
              </label>
            )}
            <label className="flex items-start gap-2 text-sm sm:col-span-2">
              <input name="approved" type="checkbox" value="true" required />I
              confirm that this background and its front mapping, when needed,
              have been approved.
            </label>
            <button className="btn-primary" disabled={busy}>
              Save approved template
            </button>
          </form>
        </details>
      ) : (
        <p className="notice">Templates are read-only for Officer accounts.</p>
      )}
      {role === 'admin' && (
        <section className="space-y-3 rounded-2xl border bg-white p-5">
          <div>
            <h2 className="font-semibold">Officer access</h2>
            <p className="text-sm text-slate-600">
              New Supabase Auth users remain inactive until an administrator
              enables them.
            </p>
          </div>
          {officers.map((officer) => (
            <div
              key={officer.id}
              className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_10rem_auto_auto] sm:items-end"
            >
              <label className="field">
                Name
                <input
                  value={officer.display_name}
                  onChange={(event) =>
                    setOfficers((items) =>
                      items.map((item) =>
                        item.id === officer.id
                          ? { ...item, display_name: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
                <span className="text-xs text-slate-500">{officer.email}</span>
              </label>
              <label className="field">
                Role
                <select
                  value={officer.role}
                  onChange={(event) =>
                    setOfficers((items) =>
                      items.map((item) =>
                        item.id === officer.id
                          ? {
                              ...item,
                              role: event.target.value as OfficerAccess['role'],
                            }
                          : item,
                      ),
                    )
                  }
                >
                  <option value="officer">Officer</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label className="flex gap-2 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={officer.is_active}
                  onChange={(event) =>
                    setOfficers((items) =>
                      items.map((item) =>
                        item.id === officer.id
                          ? { ...item, is_active: event.target.checked }
                          : item,
                      ),
                    )
                  }
                />
                Active
              </label>
              <button
                className="btn"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError('');
                  setMessage('');
                  try {
                    const saved = await api<OfficerAccess>(
                      `officers/${officer.id}`,
                      { method: 'PUT', body: JSON.stringify(officer) },
                    );
                    setOfficers((items) =>
                      items.map((item) =>
                        item.id === saved.id ? saved : item,
                      ),
                    );
                    setMessage(`Access updated for ${saved.email}.`);
                  } catch (error) {
                    setError(errorText(error));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Save access
              </button>
            </div>
          ))}
        </section>
      )}
      {busy && <output className="block">Saving configuration…</output>}
      {message && <output className="notice block">{message}</output>}
      {error && (
        <p className="notice-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface OfficerAccess {
  id: string;
  email: string;
  display_name: string;
  role: 'admin' | 'officer';
  is_active: boolean;
}

function TemplateBackground({ template, label, side }: { template?: Template; label: string; side: string }) {
  return <div>
    <h3 className="font-medium capitalize">{side}</h3>
    {template ? <>
      <a href={`#preview-${template.key}`} className="block" onClick={event => {
        event.preventDefault();
        (document.getElementById(`preview-${template.key}`) as HTMLDialogElement)?.showModal();
      }}>
        <PrivateImage path={template.image} alt={`${label} ${side} template`} className="mx-auto my-3 aspect-[1200/1950] w-full max-w-64 object-contain" />
        <span className="text-sm text-blue-700">Enlarge preview</span>
      </a>
      <p className="mt-2 text-xs text-emerald-800">{template.approved ? 'Approved' : 'Not approved'} · 1200 × 1950 px</p>
      <dialog id={`preview-${template.key}`} className="fixed inset-0 m-auto max-h-[95vh] w-[min(90vw,600px)] overflow-auto rounded-2xl p-4 backdrop:bg-black/60">
        <form method="dialog" className="flex items-center justify-between gap-3">
          <h3 className="font-semibold capitalize">{label} {side}</h3><button className="btn">Close</button>
        </form>
        <PrivateImage path={template.image} alt={`${label} ${side} enlarged template`} className="mt-3 w-full" />
      </dialog>
    </> : <div className="mt-3 flex aspect-[1200/1950] max-h-96 items-center justify-center rounded-xl border border-dashed bg-slate-50 p-3 text-center text-sm text-slate-500">No {side} design uploaded</div>}
  </div>;
}

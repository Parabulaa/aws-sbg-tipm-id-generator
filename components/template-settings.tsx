/* oxlint-disable next/no-img-element -- Private authenticated and local object URLs must bypass image optimization. */
'use client';
import { useState } from 'react';
import { useData } from './data-provider';
import { api, errorText, fileUrl } from '@/lib/client';
import { categories } from '@/lib/domain';
import type { ColorSettings } from '@/lib/domain';
export function TemplateSettings() {
  const { templates, colors, refresh } = useData();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<ColorSettings>(colors);
  return (
    <div className="mt-6 space-y-6">
      <p className="notice">
        Use approved 1200 × 1950 PNG backgrounds with matching field
        coordinates. No sample designs are supplied. Officer colors affect only
        explicitly mapped accent regions.
      </p>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.flatMap((category) =>
          (['front', 'back'] as const).map((side) => {
            const template = templates.find(
              (item) => item.category === category && item.side === side,
            );
            return (
              <div
                key={`${category}-${side}`}
                className="rounded-2xl border bg-white p-4"
              >
                <h2 className="font-semibold capitalize">
                  {category} {side}
                </h2>
                {template ? (
                  <>
                    <a
                      href={fileUrl(template.image)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={fileUrl(template.image)}
                        alt={`${category} ${side} approved background`}
                        className="mx-auto my-3 w-40"
                      />
                    </a>
                    <p className="text-sm text-emerald-800">
                      Approved · 1200 × 1950 px
                    </p>
                    <a
                      className="btn mt-3"
                      href={fileUrl(template.image)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Preview background
                    </a>
                  </>
                ) : (
                  <p className="my-6 text-slate-500">
                    Approved template not supplied.
                  </p>
                )}
              </div>
            );
          }),
        )}
      </section>
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
              if (!(mapping instanceof File))
                throw new Error('Choose the field mapping JSON.');
              form.set('layout', await mapping.text());
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
            <select name="category" aria-label="Membership">
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Side
            <select name="side" aria-label="Side">
              <option value="front">Front</option>
              <option value="back">Back</option>
            </select>
          </label>
          <label className="field">
            Approved PNG
            <input name="image" type="file" accept="image/png" required />
          </label>
          <label className="field">
            Field mapping JSON
            <input name="mapping" type="file" accept=".json" required />
          </label>
          <label className="flex items-start gap-2 text-sm sm:col-span-2">
            <input name="approved" type="checkbox" value="true" required />I
            confirm that this background, dynamic field mapping, and colorable
            regions have been approved.
          </label>
          <button className="btn-primary" disabled={busy}>
            Save approved template
          </button>
        </form>
      </details>
      <section
        id="colors"
        className="rounded-2xl border bg-white p-5 space-y-4"
      >
        <h2 className="font-semibold">Officer team colors</h2>
        <label className="field">
          Officer Color Mode
          <select
            aria-label="Officer Color Mode"
            value={settings.mode}
            onChange={(event) =>
              setSettings({
                ...settings,
                mode: event.target.value as ColorSettings['mode'],
              })
            }
          >
            <option value="default">Default Officer Green</option>
            <option value="team">Team-Based Colors</option>
          </select>
        </label>
        {settings.teams.map((team, index) => (
          <div key={index} className="flex flex-wrap items-end gap-3">
            <label className="field flex-1">
              Team name
              <input
                value={team.name}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    teams: settings.teams.map((item, i) =>
                      i === index
                        ? { ...item, name: event.target.value }
                        : item,
                    ),
                  })
                }
              />
            </label>
            <label className="field">
              Accent
              <input
                type="color"
                value={team.color}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    teams: settings.teams.map((item, i) =>
                      i === index
                        ? { ...item, color: event.target.value }
                        : item,
                    ),
                  })
                }
              />
            </label>
            <label className="flex gap-2 py-2 text-sm">
              <input
                type="checkbox"
                checked={team.enabled}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    teams: settings.teams.map((item, i) =>
                      i === index
                        ? { ...item, enabled: event.target.checked }
                        : item,
                    ),
                  })
                }
              />
              Enabled
            </label>
            <button
              className="btn"
              onClick={() =>
                setSettings({
                  ...settings,
                  teams: settings.teams.filter((_, i) => i !== index),
                })
              }
            >
              Remove
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <button
            className="btn"
            onClick={() =>
              setSettings({
                ...settings,
                teams: [
                  ...settings.teams,
                  { name: '', color: '#10b981', enabled: true },
                ],
              })
            }
          >
            Add team
          </button>
          <button
            className="btn-primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              setMessage('');
              try {
                const updated = await api<ColorSettings>('colors', {
                  method: 'PUT',
                  body: JSON.stringify(settings),
                });
                setSettings(updated);
                await refresh();
                setMessage(
                  'Officer colors saved. Preview updates on the review page; existing files remain unchanged.',
                );
              } catch (error) {
                setError(errorText(error));
              } finally {
                setBusy(false);
              }
            }}
          >
            Save colors
          </button>
        </div>
      </section>
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

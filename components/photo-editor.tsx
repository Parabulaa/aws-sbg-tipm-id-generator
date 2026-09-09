/* oxlint-disable next/no-img-element -- Private authenticated and local object URLs must bypass image optimization. */
'use client';
import { useEffect, useRef, useState } from 'react';
import type { MemberRecord, Crop } from '@/lib/domain';
import { defaultCrop } from '@/lib/domain';
import { fileUrl, api, errorText } from '@/lib/client';
import { normalizePhoto } from '@/lib/render-id';
export function PhotoEditor({
  member,
  onMember,
  onCrop,
  onPreview,
}: {
  member: MemberRecord;
  onMember: (member: MemberRecord) => void;
  onCrop: (crop: Crop) => void;
  onPreview: (url?: string) => void;
}) {
  const [pending, setPending] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const drag = useRef<{ x: number; y: number; crop: Crop } | null>(null);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  const source =
    url || (member.photo_path ? fileUrl(member.photo_path) : undefined);
  const crop = member.photo_crop_data;
  return (
    <section className="space-y-3">
      <h3 className="font-semibold">Member photo</h3>
      <label className="field">
        {source ? 'Replace photo' : 'Upload photo'}
        <input
          aria-label="Upload member photo"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setError('');
            try {
              const blob = await normalizePhoto(file);
              const objectUrl = URL.createObjectURL(blob);
              setPending(blob);
              setUrl(objectUrl);
              onCrop({ ...defaultCrop });
              onPreview(objectUrl);
            } catch (error) {
              setError(errorText(error));
            } finally {
              setBusy(false);
              event.target.value = '';
            }
          }}
        />
      </label>
      {source && (
        <>
          <div
            className="relative mx-auto h-52 w-44 touch-none overflow-hidden rounded-xl border bg-slate-100"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = {
                x: event.clientX,
                y: event.clientY,
                crop: { ...crop },
              };
            }}
            onPointerMove={(event) => {
              if (!drag.current) return;
              onCrop({
                ...crop,
                x: Math.max(
                  0,
                  Math.min(
                    1,
                    drag.current.crop.x -
                      (event.clientX - drag.current.x) / 180,
                  ),
                ),
                y: Math.max(
                  0,
                  Math.min(
                    1,
                    drag.current.crop.y -
                      (event.clientY - drag.current.y) / 220,
                  ),
                ),
              });
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          >
            <img
              alt="Position adjustment"
              draggable={false}
              src={source}
              className="h-full w-full object-cover"
              style={{
                objectPosition: `${crop.x * 100}% ${crop.y * 100}%`,
                transform: `scale(${crop.zoom})`,
                transformOrigin: `${crop.x * 100}% ${crop.y * 100}%`,
              }}
            />
          </div>
          <p className="text-sm text-slate-500">
            Drag to reposition, or use the sliders. The ID preview shows the
            approved photo region.
          </p>
          {(['zoom', 'x', 'y'] as const).map((key) => (
            <label className="field" key={key}>
              {key === 'zoom'
                ? 'Zoom'
                : key === 'x'
                  ? 'Horizontal position'
                  : 'Vertical position'}
              <input
                type="range"
                min={key === 'zoom' ? 1 : 0}
                max={key === 'zoom' ? 4 : 1}
                step="0.01"
                value={crop[key]}
                onChange={(event) =>
                  onCrop({ ...crop, [key]: Number(event.target.value) })
                }
              />
            </label>
          ))}
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={() => onCrop({ ...defaultCrop })}>
              Reset position
            </button>
            {pending && (
              <button
                className="btn-primary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError('');
                  try {
                    const form = new FormData();
                    form.set('photo', pending, 'photo.png');
                    form.set('revision', String(member.revision));
                    form.set('crop', JSON.stringify(crop));
                    const updated = await api<MemberRecord>(
                      `members/${member.id}/photo`,
                      { method: 'POST', body: form },
                    );
                    onMember({ ...updated, photo_crop_data: crop });
                    setPending(null);
                    setUrl(undefined);
                    onPreview(undefined);
                  } catch (error) {
                    setError(errorText(error));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Apply uploaded photo
              </button>
            )}
            {member.photo_path && (
              <button
                className="btn"
                disabled={busy || !!pending}
                onClick={async () => {
                  if (
                    !window.confirm(
                      'Remove this member’s photo? The member will need review again.',
                    )
                  )
                    return;
                  setBusy(true);
                  try {
                    onMember(
                      await api<MemberRecord>(`members/${member.id}/photo`, {
                        method: 'DELETE',
                        body: JSON.stringify({ revision: member.revision }),
                      }),
                    );
                  } catch (error) {
                    setError(errorText(error));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Remove photo
              </button>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Apply saves the upload and its crop. Use Save information after
            further position adjustments. A photo does not confirm the member
            automatically.
          </p>
        </>
      )}
      {busy && <output className="block">Saving photo…</output>}
      {error && (
        <p role="alert" className="notice-error">
          {error}
        </p>
      )}
    </section>
  );
}

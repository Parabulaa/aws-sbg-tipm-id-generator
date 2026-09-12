/* oxlint-disable next/no-img-element -- Private authenticated and local object URLs must bypass image optimization. */
'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, RotateCcw, Trash2, Upload } from 'lucide-react';
import type { MemberRecord, Crop } from '@/lib/domain';
import { defaultCrop } from '@/lib/domain';
import { fileUrl, api, errorText, invalidatePrivateBlob } from '@/lib/client';
import { normalizePhoto } from '@/lib/render-id';
import { PrivateImage } from './private-image';
import type { TemplateLayout } from '@/lib/templates';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function PhotoEditor({
  member, onMember, onCrop, onPreview, onNotify, photoRegion,
}: {
  member: MemberRecord;
  onMember: (member: MemberRecord) => void;
  onCrop: (crop: Crop) => void;
  onPreview: (url?: string) => void;
  onNotify?: (message: string, type?: 'success' | 'error') => void;
  photoRegion?: TemplateLayout['photo'];
}) {
  const [pending, setPending] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const drag = useRef<{ x: number; y: number; crop: Crop } | null>(null);

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  const source = url || (member.photo_path ? fileUrl(member.photo_path) : undefined);
  const crop = member.photo_crop_data;

  async function removePhoto() {
    setBusy(true);
    setError('');
    try {
      const updated = await api<MemberRecord>(`members/${member.id}/photo`, {
        method: 'DELETE',
        body: JSON.stringify({ revision: member.revision }),
      });
      if (member.photo_path) invalidatePrivateBlob(member.photo_path);
      onMember(updated);
      onPreview(undefined);
      onNotify?.('Photo removed');
    } catch (caught) {
      const message = errorText(caught);
      setError(message);
      onNotify?.(message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="generate-photo-grid">
      <label className="generate-upload-zone">
        {busy ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
        <span className="font-semibold">{source ? 'Replace Photo' : 'Upload Photo'}</span>
        <span className="text-xs text-slate-500">PNG, JPG or WebP · max 5 MB</span>
        <input
          className="sr-only"
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
              if (url) URL.revokeObjectURL(url);
              const objectUrl = URL.createObjectURL(blob);
              setPending(blob);
              setUrl(objectUrl);
              onCrop({ ...defaultCrop });
              onPreview(objectUrl);
              onNotify?.('Photo updated');
            } catch (caught) {
              const message = errorText(caught);
              setError(message);
              onNotify?.(message, 'error');
            } finally {
              setBusy(false);
              event.target.value = '';
            }
          }}
        />
      </label>

      <div className="generate-photo-preview-wrap">
        {source ? (
          <div
            className="generate-photo-preview"
            style={{
              aspectRatio: photoRegion ? `${photoRegion.width} / ${photoRegion.height}` : '176 / 208',
              borderRadius: photoRegion
                ? `${((photoRegion.borderRadius ?? 0) / photoRegion.width) * 100}% / ${((photoRegion.borderRadius ?? 0) / photoRegion.height) * 100}%`
                : '12px',
              clipPath: photoRegion?.clipPolygon
                ? `polygon(${photoRegion.clipPolygon.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(',')})`
                : undefined,
            }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = { x: event.clientX, y: event.clientY, crop: { ...crop } };
            }}
            onPointerMove={(event) => {
              if (!drag.current) return;
              onCrop({
                ...crop,
                x: Math.max(0, Math.min(1, drag.current.crop.x - (event.clientX - drag.current.x) / 180)),
                y: Math.max(0, Math.min(1, drag.current.crop.y - (event.clientY - drag.current.y) / 220)),
              });
            }}
            onPointerUp={() => { drag.current = null; }}
            onPointerCancel={() => { drag.current = null; }}
          >
            {url ? (
              /* oxlint-disable-next-line jsx-a11y(img-redundant-alt) -- Preserve the established accessible name used by the photo workflow. */
              <img
                alt="Position adjustment" draggable={false} src={source}
                className="h-full w-full object-cover"
                style={{
                  objectPosition: `${crop.x * 100}% ${crop.y * 100}%`,
                  transform: `scale(${crop.zoom})`,
                  transformOrigin: `${crop.x * 100}% ${crop.y * 100}%`,
                }}
              />
            ) : (
              <PrivateImage
                path={member.photo_path!} alt="Position adjustment"
                className="h-full w-full object-cover"
                style={{
                  objectPosition: `${crop.x * 100}% ${crop.y * 100}%`,
                  transform: `scale(${crop.zoom})`,
                  transformOrigin: `${crop.x * 100}% ${crop.y * 100}%`,
                }}
              />
            )}
          </div>
        ) : (
          <div className="generate-photo-empty"><ImagePlus className="size-8" /><span>No photo</span></div>
        )}
        <span className="text-center text-xs text-slate-500">Drag photo to reposition</span>
      </div>

      <div className="space-y-3">
        {(['zoom', 'x', 'y'] as const).map((key) => (
          <label className="generate-slider" key={key}>
            <span>{key === 'zoom' ? 'Zoom' : key === 'x' ? 'Horizontal' : 'Vertical'}</span>
            <input
              type="range" min={key === 'zoom' ? 1 : 0} max={key === 'zoom' ? 4 : 1}
              aria-label={key === 'zoom' ? 'Zoom' : key === 'x' ? 'Horizontal position' : 'Vertical position'}
              step="0.01" value={crop[key]}
              onChange={(event) => onCrop({ ...crop, [key]: Number(event.target.value) })}
            />
            <output>{key === 'zoom' ? `${crop[key].toFixed(2)}×` : `${Math.round((crop[key] - 0.5) * 200)}%`}</output>
          </label>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <button className="btn generate-control-button" type="button" onClick={() => onCrop({ ...defaultCrop })}>
            <RotateCcw className="size-4" /> Reset Position
          </button>
          <AlertDialog>
            <AlertDialogTrigger
              render={<button aria-label="Remove member photo" className="btn-danger generate-control-button" type="button" disabled={busy || !!pending || !member.photo_path} />}
            >
              <Trash2 className="size-4" /> Remove Photo
            </AlertDialogTrigger>
            <AlertDialogContent className="generate-dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this member photo?</AlertDialogTitle>
                <AlertDialogDescription>
                  The member will return to photo review and the ID preview will update immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 text-white hover:bg-red-500" onClick={() => void removePhoto()}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {pending && (
          <button
            className="btn-primary w-full" type="button" disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                const form = new FormData();
                form.set('photo', pending, 'photo.png');
                form.set('revision', String(member.revision));
                form.set('crop', JSON.stringify(crop));
                const updated = await api<MemberRecord>(`members/${member.id}/photo`, { method: 'POST', body: form });
                if (member.photo_path && member.photo_path !== updated.photo_path)
                  invalidatePrivateBlob(member.photo_path);
                onMember({ ...updated, photo_crop_data: crop });
                setPending(null);
                setUrl(undefined);
                onPreview(undefined);
                onNotify?.('Photo saved');
              } catch (caught) {
                const message = errorText(caught);
                setError(message);
                onNotify?.(message, 'error');
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {busy ? 'Saving...' : 'Apply Uploaded Photo'}
          </button>
        )}
      </div>
      {error && <p role="alert" className="notice-error col-span-full">{error}</p>}
    </div>
  );
}

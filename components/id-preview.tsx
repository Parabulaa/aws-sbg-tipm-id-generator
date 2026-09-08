'use client';
import { useEffect, useRef, useState } from 'react';
import type { MemberRecord, ColorSettings } from '@/lib/domain';
import type { Template, Side } from '@/lib/templates';
import { renderID } from '@/lib/render-id';
import { errorText } from '@/lib/client';
export function IDPreview({
  member,
  templates,
  colors,
  photoOverride,
}: {
  member: MemberRecord;
  templates: Template[];
  colors: ColorSettings;
  photoOverride?: string;
}) {
  const [side, setSide] = useState<Side>('front');
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const template = templates.find(
    (item) => item.category === member.membership_type && item.side === side,
  );
  useEffect(() => {
    let cancelled = false;
    if (!template || !canvas.current) return;
    setLoading(true);
    setError('');
    const scratch = document.createElement('canvas');
    void renderID(scratch, member, template, colors, photoOverride)
      .then(() => {
        if (!cancelled && canvas.current) {
          canvas.current.width = 1200;
          canvas.current.height = 1950;
          canvas.current.getContext('2d')!.drawImage(scratch, 0, 0);
        }
      })
      .catch((error) => {
        if (!cancelled) setError(errorText(error));
      })
      .finally(() => {
        scratch.width = 0;
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [member, template, colors, photoOverride]);
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <h2 className="font-semibold">
          ID Preview{' '}
          <span className="text-sm font-normal text-slate-500">
            1200 × 1950 px
          </span>
        </h2>
        <div className="flex gap-2">
          {(['front', 'back'] as const).map((value) => (
            <button
              className={value === side ? 'btn-primary' : 'btn'}
              aria-pressed={value === side}
              key={value}
              onClick={() => setSide(value)}
            >
              {value === 'front' ? 'Front' : 'Back'}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-slate-100 p-4 sm:p-6">
        {template ? (
          <>
            <canvas
              ref={canvas}
              width={1200}
              height={1950}
              aria-label={`${side} ID preview for ${member.aws_sbg_id}`}
              className={`mx-auto block aspect-[1200/1950] w-full max-w-[400px] bg-white shadow-sm ${loading || error ? 'opacity-40' : ''}`}
            />
            {loading && <output className="block">Updating preview…</output>}
            {error && (
              <p className="notice-error" role="alert">
                {error}
              </p>
            )}
          </>
        ) : (
          <p className="notice">
            Approved {member.membership_type} {side} template is not configured.
            Add the approved PNG and field mapping in Templates.
          </p>
        )}
      </div>
    </section>
  );
}

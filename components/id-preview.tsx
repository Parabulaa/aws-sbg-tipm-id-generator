'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye, Loader2, Search } from 'lucide-react';
import type { MemberRecord, ColorSettings } from '@/lib/domain';
import type { Template, Side } from '@/lib/templates';
import { renderID } from '@/lib/render-id';
import { selectTemplate } from '@/lib/templates';
import { errorText } from '@/lib/client';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

export function IDPreview({
  member, templates, colors, photoOverride, side, onSideChange, footer,
}: {
  member: MemberRecord;
  templates: Template[];
  colors: ColorSettings;
  photoOverride?: string;
  side: Side;
  onSideChange: (side: Side) => void;
  footer?: React.ReactNode;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const zoomCanvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const template = selectTemplate(templates, member, side);

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
      .catch((caught) => {
        if (!cancelled) setError(errorText(caught));
      })
      .finally(() => {
        scratch.width = 0;
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [member, template, colors, photoOverride]);

  useEffect(() => {
    if (!zoomed || !canvas.current || !zoomCanvas.current) return;
    zoomCanvas.current.width = 1200;
    zoomCanvas.current.height = 1950;
    zoomCanvas.current.getContext('2d')!.drawImage(canvas.current, 0, 0);
  }, [zoomed, side, loading]);

  return (
    <section className="generate-card generate-preview-card">
      <div className="generate-card-heading">
        <span className="generate-card-icon"><Eye className="size-4" /></span>
        <div>
          <h2>ID Preview</h2>
          <p>Preview the exact exported ID.</p>
        </div>
        <div className="generate-segmented" aria-label="ID side">
          <span className={side === 'back' ? 'translate-x-full' : ''} />
          {(['front', 'back'] as const).map((value) => (
            <button
              type="button" key={value} aria-pressed={value === side}
              onClick={() => onSideChange(value)}
            >
              {value === 'front' ? 'Front' : 'Back'}
            </button>
          ))}
        </div>
      </div>
      <div className="generate-preview-stage">
        {template ? (
          <button
            type="button" className="generate-preview-button"
            aria-label={`Zoom ${side} ID preview`}
            onClick={() => setZoomed(true)}
          >
            <canvas
              ref={canvas} width={1200} height={1950}
              aria-label={`${side} ID preview for ${member.aws_sbg_id}`}
              className={`generate-id-canvas ${loading || error ? 'opacity-40' : ''}`}
            />
            <span className="generate-preview-zoom"><Search className="size-5" /></span>
            {loading && <span className="generate-preview-loading"><Loader2 className="size-5 animate-spin" /> Updating</span>}
          </button>
        ) : (
          <p className="notice">
            Approved {member.membership_type} {side} template is not configured.
          </p>
        )}
        {template && <button type="button" className="generate-click-zoom" onClick={() => setZoomed(true)}><Search className="size-3.5" /> Click ID to zoom</button>}
        {error && <p className="notice-error" role="alert">{error}</p>}
      </div>
      {footer && <div className="generate-preview-footer">{footer}</div>}

      <Dialog open={zoomed} onOpenChange={setZoomed}>
        <DialogContent className="generate-zoom-dialog">
          <DialogHeader>
            <DialogTitle>ID Preview (Zoomed)</DialogTitle>
            <DialogDescription>{side === 'front' ? 'Front' : 'Back'} · 1200 × 1950 px</DialogDescription>
          </DialogHeader>
          <canvas
            ref={zoomCanvas} width={1200} height={1950}
            aria-label={`Zoomed ${side} ID preview for ${member.aws_sbg_id}`}
            className="mx-auto max-h-[76vh] max-w-full object-contain"
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}

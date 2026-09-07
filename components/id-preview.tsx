import { useState } from 'react';
import { IDFront } from '@/components/id-front';
import { IDBack } from '@/components/id-back';
import { SurfaceCard } from '@/components/surface-card';
import type { Member } from '@/lib/types';

type IdPreviewProps = {
  member: Member;
};

export function IDPreview({ member }: IdPreviewProps) {
  const [side, setSide] = useState<'front' | 'back'>('front');

  return (
    <SurfaceCard className="overflow-hidden" aria-label="ID preview">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-semibold text-slate-950">ID Preview</h2>
          <p className="mt-1 text-sm text-slate-500">1200 × 1950 px</p>
        </div>
        <div className="inline-flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="ID side">
          {(['front', 'back'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={side === tab}
              onClick={() => setSide(tab)}
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                side === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-[610px] place-items-center bg-slate-100 p-6 sm:p-10">
        <div className="aspect-[1200/1950] h-auto w-full max-w-[350px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          {side === 'front' ? <IDFront member={member} /> : <IDBack member={member} />}
        </div>
      </div>
    </SurfaceCard>
  );
}

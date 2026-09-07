import { Eye, RefreshCw } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { SurfaceCard } from '@/components/surface-card';
import type { MembershipType } from '@/lib/types';

type TemplateCardProps = {
  type: MembershipType;
  side: 'Front' | 'Back';
};

const templates = {
  member: { label: 'Member', accent: 'bg-amber-400', surface: 'bg-amber-50' },
  officer: { label: 'Officer', accent: 'bg-emerald-500', surface: 'bg-emerald-50' },
  associate: { label: 'Associate', accent: 'bg-violet-500', surface: 'bg-violet-50' },
};

export function TemplateCard({ type, side }: TemplateCardProps) {
  const template = templates[type];

  return (
    <SurfaceCard className="overflow-hidden">
      <div className={`grid min-h-64 place-items-center p-6 ${template.surface}`}>
        <div className="aspect-[1200/1950] w-28 overflow-hidden rounded-xl bg-white shadow-lg shadow-slate-900/10">
          <div className={`h-12 ${template.accent}`} />
          <div className="space-y-3 p-4">
            <div className="h-12 rounded-lg bg-slate-100" />
            <div className="h-2 w-4/5 rounded-full bg-slate-200" />
            <div className="h-2 w-2/3 rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-950">{template.label} {side}</h2>
            <p className="mt-1 text-sm text-slate-500">1200 × 1950 px</p>
          </div>
          <StatusBadge status="active" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Eye className="size-4" /> Preview
          </button>
          <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            <RefreshCw className="size-4" /> Replace Template
          </button>
        </div>
      </div>
    </SurfaceCard>
  );
}

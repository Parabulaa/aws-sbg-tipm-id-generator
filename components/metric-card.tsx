import type { LucideIcon } from 'lucide-react';
import { SurfaceCard } from '@/components/surface-card';

type MetricCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: 'slate' | 'amber' | 'green' | 'purple' | 'rose';
};

const tones = {
  slate: 'bg-slate-100 text-slate-700',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-emerald-100 text-emerald-700',
  purple: 'bg-violet-100 text-violet-700',
  rose: 'bg-rose-100 text-rose-700',
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = 'slate',
}: MetricCardProps) {
  return (
    <SurfaceCard className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <span
          className={`grid size-11 place-items-center rounded-2xl ${tones[tone]}`}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </SurfaceCard>
  );
}

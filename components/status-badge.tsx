import { cn } from '@/lib/utils';

type StatusBadgeProps = {
  status: 'generated' | 'pending' | 'expired' | 'active';
};

const statusStyles = {
  generated: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  expired: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset', statusStyles[status])}>
      {status}
    </span>
  );
}

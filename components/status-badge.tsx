import type { MemberStatus } from '@/lib/domain';
const colors: Record<MemberStatus, string> = {
  Draft: 'bg-slate-100 text-slate-700',
  'Needs Photo': 'bg-blue-50 text-blue-800',
  'Needs Attention': 'bg-red-50 text-red-800',
  Ready: 'bg-amber-50 text-amber-800',
  Generated: 'bg-emerald-50 text-emerald-800',
};
export function StatusBadge({ status }: { status: MemberStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-semibold ${colors[status]}`}
    >
      {status}
    </span>
  );
}

import type { MemberStatus } from '@/lib/domain';
const colors: Record<MemberStatus, string> = {
  Draft: 'status-draft',
  'Needs Photo': 'status-pending',
  'Needs Attention': 'status-pending',
  Ready: 'status-ready',
  Generated: 'status-generated',
};
export function StatusBadge({ status }: { status: MemberStatus }) {
  return (
    <span className={`member-status ${colors[status]}`}>
      <span aria-hidden="true" />{status}
    </span>
  );
}

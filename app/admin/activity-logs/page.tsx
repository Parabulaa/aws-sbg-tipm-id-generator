import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { AdminActivityLogs } from '@/components/admin-activity-logs';

export default function ActivityLogsPage() {
  return (
    <AppLayout fullWidth>
      <div className="mx-auto w-full max-w-[90rem]">
        <PageHeader
          title="Activity Logs"
          description="Track important system actions and changes."
          actions={<p className="hidden text-xs text-slate-500 lg:block">AWS SBG TIP Manila <span className="px-2 text-cyan-400">›</span> Activity Logs</p>}
        />
        <AdminActivityLogs />
      </div>
    </AppLayout>
  );
}

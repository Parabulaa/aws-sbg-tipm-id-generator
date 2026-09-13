import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { AdminAccessManagement } from '@/components/admin-access-management';

export default function AccessManagementPage() {
  return (
    <AppLayout fullWidth>
      <div className="mx-auto w-full max-w-[90rem]">
        <PageHeader
          title="Access Management"
          description="Manage officer accounts and system access."
          actions={<p className="hidden text-xs text-slate-500 lg:block">AWS SBG TIP Manila <span className="px-2 text-cyan-400">›</span> Access Management</p>}
        />
        <AdminAccessManagement />
      </div>
    </AppLayout>
  );
}

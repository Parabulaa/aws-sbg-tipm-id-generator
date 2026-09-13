import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { MemberDirectory } from '@/components/member-directory';
export default function MembersPage() {
  return (
    <AppLayout fullWidth>
      <div className="mx-auto w-full max-w-[90rem]">
        <PageHeader
          title="Members"
          description="Import, review, and manage organization members."
          actions={
            <p className="hidden text-xs text-slate-500 lg:block">
              AWS SBG TIP Manila <span className="px-2 text-cyan-400">›</span> Members
            </p>
          }
        />
        <MemberDirectory />
      </div>
    </AppLayout>
  );
}

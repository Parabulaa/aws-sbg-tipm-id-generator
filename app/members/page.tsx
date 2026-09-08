import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { MemberDirectory } from '@/components/member-directory';
export default function MembersPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Members"
        description="Import, review, and manage organization members."
      />
      <MemberDirectory />
    </AppLayout>
  );
}

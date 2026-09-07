import { AppLayout } from '@/components/app-layout';
import { MemberTable } from '@/components/member-table';
import { PageHeader } from '@/components/page-header';
import { SurfaceCard } from '@/components/surface-card';
import { members } from '@/lib/mock-data';

export default function MembersPage() {
  return (
    <AppLayout>
      <PageHeader title="Members" description="Search the directory, review ID status, and start a member preview." />
      <SurfaceCard className="mt-8 overflow-hidden">
        <MemberTable members={members} />
      </SurfaceCard>
    </AppLayout>
  );
}

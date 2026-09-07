import { AppLayout } from '@/components/app-layout';
import { GeneratedIDList } from '@/components/generated-id-list';
import { PageHeader } from '@/components/page-header';
import { SurfaceCard } from '@/components/surface-card';
import { members } from '@/lib/mock-data';

export default function GeneratedIdsPage() {
  const records = members.filter((member) => member.idStatus !== 'pending');

  return (
    <AppLayout>
      <PageHeader title="Generated IDs" description="Review active and expired IDs created for organization members." />
      <SurfaceCard className="mt-8 overflow-hidden">
        <GeneratedIDList records={records} />
      </SurfaceCard>
    </AppLayout>
  );
}

import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { GeneratedHistory } from '@/components/generated-history';
export default function GeneratedIdsPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Generated IDs"
        description="Saved front/back outputs and generation history."
      />
      <GeneratedHistory />
    </AppLayout>
  );
}

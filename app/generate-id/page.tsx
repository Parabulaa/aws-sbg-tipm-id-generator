import { AppLayout } from '@/components/app-layout';
import { GenerateIdWorkspace } from '@/components/generate-id-workspace';
import { PageHeader } from '@/components/page-header';

export default function GenerateIdPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Generate ID"
        description="Select a registered member and preview their organization ID."
      />
      <GenerateIdWorkspace />
    </AppLayout>
  );
}

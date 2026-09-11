import { Suspense } from 'react';
import { AppLayout } from '@/components/app-layout';
import { GenerateIdWorkspace } from '@/components/generate-id-workspace';
import { PageHeader } from '@/components/page-header';

export default function GenerateIdPage() {
  return (
    <AppLayout fullWidth>
      <PageHeader
        title="Generate ID"
        description="Select a registered member and generate their organization ID."
      />
      <Suspense
        fallback={
          <output className="mt-6 notice block">
            Loading member review…
          </output>
        }
      >
        <GenerateIdWorkspace />
      </Suspense>
    </AppLayout>
  );
}

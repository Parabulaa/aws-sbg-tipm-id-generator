import { Suspense } from 'react';
import { AppLayout } from '@/components/app-layout';
import { GenerateIdWorkspace } from '@/components/generate-id-workspace';
import { PageHeader } from '@/components/page-header';

export default function GenerateIdPage() {
  return (
    <AppLayout fullWidth>
      <div className="mx-auto w-full max-w-[90rem]">
        <PageHeader
          title="Generate ID"
          description="Select a registered member and generate their organization ID."
          actions={
            <p className="hidden text-xs text-slate-500 lg:block">
              AWS SBG TIP Manila <span className="px-2 text-cyan-400">›</span> Generate ID
            </p>
          }
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
      </div>
    </AppLayout>
  );
}

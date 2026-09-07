import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { SurfaceCard } from '@/components/surface-card';

export default function GenerateIdPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Generate ID"
        description="Select a registered member and preview their organization ID."
      />

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]">
        <section className="space-y-6" aria-label="Member information">
          <SurfaceCard className="min-h-48 p-5 sm:p-6">
            <h2 className="font-semibold text-slate-950">Select member</h2>
            <p className="mt-1 text-sm text-slate-500">Choose a member to begin the preview.</p>
          </SurfaceCard>
          <SurfaceCard className="min-h-80 p-5 sm:p-6">
            <h2 className="font-semibold text-slate-950">Personal information</h2>
          </SurfaceCard>
        </section>

        <SurfaceCard className="min-h-[680px] overflow-hidden" aria-label="ID preview">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-slate-950">ID Preview</h2>
            <p className="mt-1 text-sm text-slate-500">Preview workspace</p>
          </div>
          <div className="grid min-h-[610px] place-items-center bg-slate-100 p-8 text-sm text-slate-400">
            Select a member to preview an ID
          </div>
        </SurfaceCard>
      </div>
    </AppLayout>
  );
}

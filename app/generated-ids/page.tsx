import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { GeneratedHistory } from '@/components/generated-history';
export default function GeneratedIdsPage() {
  return (
    <AppLayout fullWidth>
      <div className="mx-auto w-full max-w-[90rem]">
        <PageHeader
          title="Generated IDs"
          description="Saved front/back outputs and generation history."
          actions={
            <p className="hidden text-xs text-slate-500 lg:block">
              AWS SBG TIP Manila <span className="px-2 text-cyan-400">›</span> Generated IDs
            </p>
          }
        />
        <GeneratedHistory />
      </div>
    </AppLayout>
  );
}

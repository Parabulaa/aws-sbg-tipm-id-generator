import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { TemplateSettings } from '@/components/template-settings';
export default function TemplatesPage() {
  return (
    <AppLayout fullWidth>
      <div className="mx-auto w-full max-w-[90rem]">
        <PageHeader
          title="Templates"
          description="Manage approved ID templates and their field mappings."
          actions={
            <p className="hidden text-xs text-slate-500 lg:block">
              AWS SBG TIP Manila <span className="px-2 text-cyan-400">›</span> Templates
            </p>
          }
        />
        <TemplateSettings />
      </div>
    </AppLayout>
  );
}

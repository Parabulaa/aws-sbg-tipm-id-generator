import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { TemplateSettings } from '@/components/template-settings';
export default function TemplatesPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Templates"
        description="Approved front and back ID artwork with front-side field mappings."
      />
      <TemplateSettings />
    </AppLayout>
  );
}

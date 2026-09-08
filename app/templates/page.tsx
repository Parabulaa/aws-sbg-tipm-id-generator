import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { TemplateSettings } from '@/components/template-settings';
export default function TemplatesPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Templates"
        description="Approved backgrounds, field mappings, and officer team colors."
      />
      <TemplateSettings />
    </AppLayout>
  );
}

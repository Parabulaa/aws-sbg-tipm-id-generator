import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { SurfaceCard } from '@/components/surface-card';

type PagePlaceholderProps = {
  title: string;
  description: string;
};

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <AppLayout>
      <PageHeader title={title} description={description} />
      <SurfaceCard className="mt-8 h-72" />
    </AppLayout>
  );
}

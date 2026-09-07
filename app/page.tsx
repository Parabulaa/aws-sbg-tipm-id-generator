import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { SurfaceCard } from '@/components/surface-card';

export default function Home() {
  return (
    <AppLayout>
      <PageHeader
        eyebrow="AWS Student Builder Group · TIP Manila"
        title="Dashboard"
        description="A quick overview of your members and organization IDs."
      />
      <SurfaceCard className="mt-8 h-72" />
    </AppLayout>
  );
}

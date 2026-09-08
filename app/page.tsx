import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Dashboard } from '@/components/dashboard';
export default function Home() {
  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        description="Member review and ID production overview."
      />
      <Dashboard />
    </AppLayout>
  );
}

import { AppLayout } from '@/components/app-layout';
import { MetricCard } from '@/components/metric-card';
import { PageHeader } from '@/components/page-header';
import { members } from '@/lib/mock-data';
import { BadgeCheck, Clock3, ShieldCheck, UserRound, UsersRound, UserX } from 'lucide-react';

export default function Home() {
  const metrics = [
    { label: 'Total Members', value: members.length, icon: UsersRound, tone: 'slate' as const },
    { label: 'Officers', value: members.filter((member) => member.membershipType === 'officer').length, icon: ShieldCheck, tone: 'green' as const },
    { label: 'Associates', value: members.filter((member) => member.membershipType === 'associate').length, icon: UserRound, tone: 'purple' as const },
    { label: 'IDs Generated', value: members.filter((member) => member.idStatus === 'generated').length, icon: BadgeCheck, tone: 'amber' as const },
    { label: 'IDs Pending', value: members.filter((member) => member.idStatus === 'pending').length, icon: Clock3, tone: 'slate' as const },
    { label: 'Expired', value: members.filter((member) => member.idStatus === 'expired').length, icon: UserX, tone: 'rose' as const },
  ];

  return (
    <AppLayout>
      <PageHeader
        eyebrow="AWS Student Builder Group · TIP Manila"
        title="Dashboard"
        description="A quick overview of your members and organization IDs."
      />
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="ID metrics">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </section>
    </AppLayout>
  );
}

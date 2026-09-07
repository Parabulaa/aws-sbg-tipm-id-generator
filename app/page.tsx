import { AppLayout } from '@/components/app-layout';
import { MetricCard } from '@/components/metric-card';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { SurfaceCard } from '@/components/surface-card';
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
  const distribution = [
    { label: 'Members', count: members.filter((member) => member.membershipType === 'member').length, color: 'bg-amber-500' },
    { label: 'Officers', count: members.filter((member) => member.membershipType === 'officer').length, color: 'bg-emerald-500' },
    { label: 'Associates', count: members.filter((member) => member.membershipType === 'associate').length, color: 'bg-violet-500' },
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

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-slate-950">Recent ID Activity</h2>
            <p className="mt-1 text-sm text-slate-500">Latest changes across the member directory.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {members.slice(0, 5).map((member) => (
              <div key={member.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                  {member.fullName.split(' ').slice(0, 2).map((name) => name[0]).join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{member.fullName}</p>
                  <p className="truncate text-sm text-slate-500">{member.id}</p>
                </div>
                <StatusBadge status={member.idStatus} />
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5 sm:p-6">
          <h2 className="font-semibold text-slate-950">ID Distribution</h2>
          <p className="mt-1 text-sm text-slate-500">Membership mix for this cycle.</p>
          <div className="mt-7 space-y-6">
            {distribution.map((item) => {
              const percentage = Math.round((item.count / members.length) * 100);

              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="text-slate-500">{item.count} · {percentage}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </SurfaceCard>
      </section>
    </AppLayout>
  );
}

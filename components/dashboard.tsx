'use client';

import Link from 'next/link';
import {
  Archive,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock3,
  Database,
  FileBadge2,
  FileClock,
  FilePlus2,
  FolderCog,
  IdCard,
  Pencil,
  ShieldCheck,
  Upload,
  UserPlus,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { useData } from './data-provider';
import type { Activity } from '@/lib/domain';

export function Dashboard() {
  const { members, generations, activity, templates, user, role, loading } = useData();
  const officers = members.filter((member) => member.membership_type === 'Officer').length;
  const associates = members.filter((member) => member.membership_type === 'Associate').length;
  const regular = members.filter((member) => member.membership_type === 'Member').length;
  const drafts = members.filter((member) => !['Ready', 'Generated'].includes(member.status)).length;
  const ready = members.filter((member) => member.status === 'Ready').length;
  const completed = members.filter((member) => ['Ready', 'Generated'].includes(member.status)).length;
  const progress = members.length ? Math.round((completed / members.length) * 100) : 0;
  const metrics = [
    { label: 'Total Members', value: members.length, note: 'All active records', icon: UsersRound, tone: 'blue' },
    { label: 'Officers', value: officers, note: percent(officers, members.length), icon: ShieldCheck, tone: 'cyan' },
    { label: 'Associates', value: associates, note: percent(associates, members.length), icon: UserRound, tone: 'green' },
    { label: 'Regular Members', value: regular, note: percent(regular, members.length), icon: UserRound, tone: 'violet' },
    { label: 'Draft IDs', value: drafts, note: 'Needs review', icon: FileClock, tone: 'yellow' },
    { label: 'Ready IDs', value: ready, note: 'Ready for generation', icon: Clock3, tone: 'yellow' },
    { label: 'Generated IDs', value: generations.length, note: 'Saved ID versions', icon: CheckCircle2, tone: 'cyan' },
    { label: 'Templates', value: templates.filter((template) => template.approved).length, note: 'Active templates', icon: Database, tone: 'blue' },
  ];
  const steps = [
    { label: 'Import Members', state: members.length ? 'complete' : 'current' },
    { label: 'Review & Validate', state: completed ? 'complete' : members.length ? 'current' : 'pending' },
    { label: 'Generate IDs', state: generations.length ? 'complete' : ready ? 'current' : 'pending' },
    { label: 'Print & Distribute', state: generations.length ? 'current' : 'pending' },
  ] as const;

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-utility-bar">
        <span><BadgeCheck className="size-4" /> Welcome to AWS SBG TIP Manila</span>
        <span className="dashboard-user"><span className="dashboard-avatar">{initial(user)}</span><strong>{user}</strong><small>{role}</small></span>
      </div>

      <div className="dashboard-title-row">
        <div><h1>Dashboard</h1><p>Member review and ID production overview.</p></div>
        <div className="dashboard-actions">
          <Link className="btn" href="/members?import=1"><Upload className="size-4" /> Import / Review Members</Link>
          <Link className="btn-primary" href="/generate-id"><IdCard className="size-4" /> Generate Ready IDs</Link>
          <Link className="btn" href="/members?add=1"><UserPlus className="size-4" /> Add Member</Link>
        </div>
      </div>

      <section className="dashboard-metrics" aria-label="ID production metrics">
        {metrics.map(({ label, value, note, icon: Icon, tone }) => (
          <article key={label} className={`dashboard-metric-card tone-${tone}`}>
            <span className="dashboard-metric-icon"><Icon className="size-6" /></span>
            <div><p>{label}</p><strong>{loading ? <span className="dashboard-value-skeleton" /> : value}</strong><small>{note}</small></div>
          </article>
        ))}
      </section>

      <section className="dashboard-production-card">
        <header>
          <div className="dashboard-card-heading"><span><FolderCog className="size-5" /></span><div><h2>ID Production Status</h2><p>From member review to final ID generation.</p></div></div>
          <div className="dashboard-progress-summary"><div><strong>ID production</strong><small>{completed} / {members.length} ready</small></div><div className="dashboard-progress-track"><span style={{ width: `${progress}%` }} /></div><b>{progress}%</b></div>
        </header>
        <ol className="dashboard-production-steps">
          {steps.map((step, index) => <li key={step.label} className={`is-${step.state}`}><span>{step.state === 'complete' ? <Check className="size-4" /> : index + 1}</span><div><strong>{index + 1}. {step.label}</strong><small>{step.state === 'complete' ? 'Completed' : step.state === 'current' ? 'In progress' : 'Pending'}</small></div>{index < steps.length - 1 && <i />}</li>)}
        </ol>
      </section>

      <section className="dashboard-activity-card">
        <header><div className="dashboard-card-heading"><span><Clock3 className="size-5" /></span><h2>Recent Activity</h2></div><Link className="btn" href="/generated-ids">View All Activity <ArrowRight className="size-4" /></Link></header>
        {activity.length ? <ul>{activity.slice(0, 5).map((item) => <ActivityRow key={item.id} activity={item} />)}</ul> : <div className="dashboard-empty-activity"><Clock3 className="size-5" /><span>No activity yet. New member and ID actions will appear here.</span></div>}
      </section>

      <footer className="dashboard-footer"><span>AWS SBG TIP Manila ID Generator</span><span>Built for our people <i /> AWS SBG TIP Manila</span></footer>
    </div>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  const value = activity.message.toLowerCase();
  const config = value.includes('generated') ? { icon: IdCard, description: 'ID successfully generated', tone: 'cyan' } : value.includes('import') ? { icon: Upload, description: 'Member records imported from file', tone: 'blue' } : value.includes('archiv') ? { icon: Archive, description: 'Member record archived', tone: 'red' } : value.includes('updated') ? { icon: Pencil, description: 'Member information updated', tone: 'blue' } : value.includes('added') || value.includes('created') ? { icon: FilePlus2, description: 'New member record created', tone: 'green' } : { icon: FileBadge2, description: 'Organization record updated', tone: 'cyan' };
  const Icon = config.icon;
  return <li><Icon className={`size-4 tone-${config.tone}`} /><strong>{activity.message}</strong><span>{config.description}</span><time dateTime={activity.created_at}>{new Date(activity.created_at).toLocaleString()}</time></li>;
}

function percent(value: number, total: number) { return total ? `${Math.round((value / total) * 100)}% of total` : '0% of total'; }
function initial(value: string) { return value.trim().charAt(0).toUpperCase() || 'O'; }

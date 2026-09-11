'use client';
import Link from 'next/link';
import { useData } from './data-provider';
import { SurfaceCard } from './surface-card';
export function Dashboard() {
  const { members, generations, activity } = useData();
  const metrics = [
    ['Total Members', members.length],
    ['Officers', members.filter((m) => m.membership_type === 'Officer').length],
    [
      'Associates',
      members.filter((m) => m.membership_type === 'Associate').length,
    ],
    [
      'Regular Members',
      members.filter((m) => m.membership_type === 'Member').length,
    ],
    ...['Draft', 'Needs Photo', 'Needs Attention', 'Ready', 'Generated'].map(
      (status) => [
        `${status} IDs`,
        members.filter((m) => m.status === status).length,
      ],
    ),
    [
      'Expired IDs',
      members.filter(
        (m) =>
          m.valid_until !== null &&
          m.valid_until < new Date().toISOString().slice(0, 10),
      ).length,
    ],
  ];
  return (
    <div className="mt-4 space-y-4">
      <Link className="btn-primary" href="/members">
        Import / review members
      </Link>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map(([label, count]) => (
          <SurfaceCard key={label} className="p-4">
            <p className="text-sm text-slate-600">{label}</p>
            <p className="mt-1 text-2xl font-bold">{count}</p>
          </SurfaceCard>
        ))}
      </section>
      {!members.length && (
        <p className="notice">
          No members imported yet. Upload an XLSX file to begin.
        </p>
      )}
      <SurfaceCard className="p-4">
        <h2 className="font-semibold">Recent ID Activity</h2>
        <p className="mt-1 text-xs text-slate-500">{generations.length} saved versions</p>
        {activity.length ? (
          <ul className="mt-4 divide-y">
            {activity.map((item) => (
              <li key={item.id} className="py-3">
                <p>{item.message}</p>
                <time className="text-sm text-slate-500">
                  {new Date(item.created_at).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-slate-500">No activity yet.</p>
        )}
      </SurfaceCard>
    </div>
  );
}

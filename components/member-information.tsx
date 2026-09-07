import { PencilLine } from 'lucide-react';
import type { Member } from '@/lib/types';

type MemberInformationProps = {
  member: Member;
};

const formatDate = (date: string) => new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
}).format(new Date(`${date}T00:00:00`));

export function MemberInformation({ member }: MemberInformationProps) {
  const details = [
    ['Full Name', member.fullName],
    ['Organization Role', member.role],
    ['Member ID', member.id],
    ['Email', member.email],
    ['Membership Type', member.membershipType === 'associate' ? 'Associate Member' : member.membershipType],
    ['Date Issued', formatDate(member.issuedAt)],
    ['Valid Until', formatDate(member.validUntil)],
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold text-slate-950">Personal information</h2>
        <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          <PencilLine className="size-4" />
          Edit Information
        </button>
      </div>

      <div className="mt-6 flex items-center gap-4 border-b border-slate-100 pb-6">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-lg font-bold text-slate-600">
          {member.fullName.split(' ').slice(0, 2).map((name) => name[0]).join('')}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-950">{member.fullName}</p>
          <p className="mt-1 truncate text-sm text-slate-500">{member.role}</p>
        </div>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {details.map(([label, value]) => (
          <div key={label} className={label === 'Email' ? 'sm:col-span-2' : undefined}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="mt-1 break-words text-sm font-medium capitalize text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

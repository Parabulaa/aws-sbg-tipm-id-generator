'use client';

import Link from 'next/link';
import { Eye, Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import type { Member, MembershipType } from '@/lib/types';

type MemberFilter = 'all' | MembershipType;

const filters: { label: string; value: MemberFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Members', value: 'member' },
  { label: 'Officers', value: 'officer' },
  { label: 'Associates', value: 'associate' },
];

export function MemberTable({ members }: { members: Member[] }) {
  const [filter, setFilter] = useState<MemberFilter>('all');
  const [query, setQuery] = useState('');
  const visibleMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return members.filter((member) => {
      const matchesType = filter === 'all' || member.membershipType === filter;
      const matchesQuery = !normalizedQuery || [member.fullName, member.id, member.role, member.email]
        .some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesType && matchesQuery;
    });
  }, [filter, members, query]);

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex flex-wrap gap-2" aria-label="Filter members">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${filter === item.value ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="relative block sm:w-72">
          <span className="sr-only">Search members</span>
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search members"
            className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {['Photo', 'Name', 'ID Number', 'Role', 'Type', 'ID Status', 'Validity', 'Action'].map((heading) => (
                <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleMembers.map((member) => (
              <tr key={member.id} className="transition hover:bg-slate-50/80">
                <td className="px-4 py-3"><MemberAvatar member={member} /></td>
                <td className="px-4 py-3 font-semibold text-slate-900">{member.fullName}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{member.id}</td>
                <td className="max-w-48 px-4 py-3 text-slate-600">{member.role}</td>
                <td className="px-4 py-3 capitalize text-slate-600">{member.membershipType}</td>
                <td className="px-4 py-3"><StatusBadge status={member.idStatus} /></td>
                <td className="px-4 py-3 text-slate-600">{formatShortDate(member.validUntil)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" aria-label={`View ${member.fullName}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                      <Eye className="size-3.5" /> View
                    </button>
                    <Link aria-label={`Generate ID for ${member.fullName}`} href={`/generate-id?member=${member.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-2.5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400">
                      <Sparkles className="size-3.5" /> Generate ID
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!visibleMembers.length ? <p className="p-10 text-center text-sm text-slate-500">No members found for this filter.</p> : null}
    </div>
  );
}

function MemberAvatar({ member }: { member: Member }) {
  return <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{member.fullName.split(' ').slice(0, 2).map((name) => name[0]).join('')}</span>;
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
}

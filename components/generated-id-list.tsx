'use client';

import { Download, Eye } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import type { Member, MembershipType } from '@/lib/types';

type GeneratedFilter = 'all' | MembershipType;

const filters: { label: string; value: GeneratedFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Member', value: 'member' },
  { label: 'Officer', value: 'officer' },
  { label: 'Associate', value: 'associate' },
];

export function GeneratedIDList({ records }: { records: Member[] }) {
  const [filter, setFilter] = useState<GeneratedFilter>('all');
  const visibleRecords = useMemo(
    () => records.filter((record) => filter === 'all' || record.membershipType === filter),
    [filter, records],
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-slate-200 p-4 sm:p-5" aria-label="Filter generated IDs">
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {['Photo', 'Name', 'Role', 'ID Number', 'Generated Date', 'Valid Until', 'Status', 'Actions'].map((heading) => (
                <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleRecords.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3"><span className="grid size-10 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{initials(record.fullName)}</span></td>
                <td className="px-4 py-3 font-semibold text-slate-900">{record.fullName}</td>
                <td className="max-w-44 px-4 py-3 text-slate-600">{record.role}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{record.id}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(record.issuedAt)}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(record.validUntil)}</td>
                <td className="px-4 py-3"><StatusBadge status={record.idStatus} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button type="button" aria-label={`Preview ID for ${record.fullName}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                      <Eye className="size-3.5" /> Preview
                    </button>
                    <button type="button" disabled title="Export will be implemented later" aria-label={`Download ID for ${record.fullName} (not available in preview)`} className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-400">
                      <Download className="size-3.5" /> Download
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!visibleRecords.length ? <p className="p-10 text-center text-sm text-slate-500">No generated IDs in this category.</p> : null}
    </div>
  );
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('');
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`));
}

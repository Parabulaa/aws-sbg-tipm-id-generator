import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Member } from '@/lib/types';

type MemberSelectorProps = {
  members: Member[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function MemberSelector({ members, selectedId, onSelect }: MemberSelectorProps) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return members;

    return members.filter((member) =>
      [member.fullName, member.id, member.email].some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [members, query]);

  return (
    <div>
      <label htmlFor="member-search" className="text-sm font-semibold text-slate-900">Select member</label>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
        <input
          id="member-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, ID, or email"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
        />
      </div>

      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
        {results.length ? results.map((member) => {
          const selected = member.id === selectedId;

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelect(member.id)}
              className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                selected ? 'bg-amber-50 ring-1 ring-amber-200' : 'hover:bg-slate-50'
              }`}
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold ${selected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {member.fullName.split(' ').slice(0, 2).map((name) => name[0]).join('')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">{member.fullName}</span>
                <span className="block truncate text-xs text-slate-500">{member.role} · {member.id}</span>
              </span>
            </button>
          );
        }) : (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No members match your search.</p>
        )}
      </div>
    </div>
  );
}

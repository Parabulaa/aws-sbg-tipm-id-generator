'use client';

import { useState } from 'react';
import { MemberSelector } from '@/components/member-selector';
import { MemberInformation } from '@/components/member-information';
import { SurfaceCard } from '@/components/surface-card';
import { members } from '@/lib/mock-data';

export function GenerateIdWorkspace() {
  const [selectedId, setSelectedId] = useState(members[0].id);
  const selectedMember = members.find((member) => member.id === selectedId) ?? members[0];

  return (
    <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]">
      <section className="space-y-6" aria-label="Member information">
        <SurfaceCard className="p-5 sm:p-6">
          <MemberSelector members={members} selectedId={selectedId} onSelect={setSelectedId} />
        </SurfaceCard>
        <SurfaceCard className="p-5 sm:p-6">
          <MemberInformation member={selectedMember} />
        </SurfaceCard>
      </section>

      <SurfaceCard className="min-h-[680px] overflow-hidden" aria-label="ID preview">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="font-semibold text-slate-950">ID Preview</h2>
          <p className="mt-1 text-sm text-slate-500">Preview workspace</p>
        </div>
        <div className="grid min-h-[610px] place-items-center bg-slate-100 p-8 text-sm text-slate-400">
          Select a member to preview an ID
        </div>
      </SurfaceCard>
    </div>
  );
}

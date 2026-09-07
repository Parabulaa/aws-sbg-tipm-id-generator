'use client';

import { useState } from 'react';
import { IDPreview } from '@/components/id-preview';
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

      <IDPreview member={selectedMember} />
    </div>
  );
}

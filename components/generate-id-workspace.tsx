'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Download, FileText, Sparkles } from 'lucide-react';
import { IDPreview } from '@/components/id-preview';
import { MemberSelector } from '@/components/member-selector';
import { MemberInformation } from '@/components/member-information';
import { SurfaceCard } from '@/components/surface-card';
import { members } from '@/lib/mock-data';

export function GenerateIdWorkspace() {
  const [selectedId, setSelectedId] = useState(members[0].id);
  const selectedMember = members.find((member) => member.id === selectedId) ?? members[0];
  const selectedIndex = members.findIndex((member) => member.id === selectedMember.id);
  const selectAt = (index: number) => setSelectedId(members[(index + members.length) % members.length].id);

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

      <section className="min-w-0" aria-label="ID preview and actions">
        <IDPreview member={selectedMember} />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => selectAt(selectedIndex - 1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <ArrowLeft className="size-4" /> Previous
          </button>
          <button type="button" onClick={() => selectAt(selectedIndex + 1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Next <ArrowRight className="size-4" />
          </button>
          <div className="hidden flex-1 sm:block" />
          <button type="button" disabled title="ID generation will be implemented later" className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-amber-200 px-3 py-2.5 text-sm font-semibold text-amber-800">
            <Sparkles className="size-4" /> Generate ID
          </button>
          <button type="button" disabled title="PNG export will be implemented later" aria-label="Download PNG (not available in preview)" className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-500">
            <Download className="size-4" /> PNG
          </button>
          <button type="button" disabled title="PDF export will be implemented later" aria-label="Download PDF (not available in preview)" className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-500">
            <FileText className="size-4" /> PDF
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-500">Preview mode — export functionality will be implemented later.</p>
      </section>
    </div>
  );
}

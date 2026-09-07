import { Info } from 'lucide-react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { TemplateCard } from '@/components/template-card';
import type { MembershipType } from '@/lib/types';

const categories: MembershipType[] = ['member', 'officer', 'associate'];

export default function TemplatesPage() {
  return (
    <AppLayout>
      <PageHeader title="Templates" description="Review the front and back layouts used for each ID category." />
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <Info className="mt-0.5 size-5 shrink-0" />
        <p>Final ID layouts will be uploaded from Canva and used as fixed background templates.</p>
      </div>
      <section className="mt-6 grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
        {categories.flatMap((type) => (['Front', 'Back'] as const).map((side) => (
          <TemplateCard key={`${type}-${side}`} type={type} side={side} />
        )))}
      </section>
    </AppLayout>
  );
}

import { AppLayout } from '@/components/app-layout';

export default function Home() {
  return (
    <AppLayout>
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-600">
          AWS Student Builder Group · TIP Manila
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">ID Generator workspace</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Frontend prototype workspace for managing members and previewing organization IDs.
        </p>
      </section>
    </AppLayout>
  );
}

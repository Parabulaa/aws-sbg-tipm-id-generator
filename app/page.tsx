import Link from 'next/link';
export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-5 py-8 text-white sm:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-amber-500 text-xs font-black text-slate-950">AWS</div>
            <span className="text-sm font-semibold tracking-wide text-slate-200">SBG · TIP MANILA</span>
          </div>
          <Link className="text-sm font-semibold text-amber-300 transition hover:text-amber-200" href="/login">Officer login <span aria-hidden="true">↗</span></Link>
        </header>

        <section className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[1.15fr_.85fr] lg:py-24">
          <div>
            <p className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Internal officer workspace</p>
            <h1 className="mt-6 max-w-3xl text-5xl font-bold tracking-tight sm:text-7xl">Build once.<br /><span className="text-amber-400">Issue confidently.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">Create accurate, production-ready AWS Student Builder Group identification cards from one secure review workflow.</p>
            <Link className="btn-primary mt-9 inline-flex px-6" href="/login">Open officer workspace <span aria-hidden="true">→</span></Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[.06] p-5 shadow-2xl backdrop-blur sm:p-7">
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Workflow at a glance</p>
              <div className="mt-5 space-y-4">
                {['Import member records', 'Review and verify details', 'Generate fixed-size IDs'].map((step, index) => (
                  <div key={step} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[.04] p-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-500 text-sm font-bold text-slate-950">0{index + 1}</span>
                    <span className="text-sm font-medium text-slate-200">{step}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 border-t border-white/10 pt-4 text-xs leading-5 text-slate-400">Authorized officers only · 1200 × 1950 px export format</p>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 pt-5 text-xs text-slate-500">AWS Student Builder Group – TIP Manila</footer>
      </div>
    </main>
  );
}

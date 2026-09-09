import Link from 'next/link';
export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-5 py-12 text-white">
      <section className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl sm:p-12">
        <div className="mb-8 grid size-16 place-items-center rounded-2xl bg-amber-500 text-xl font-black text-slate-950">
          AWS
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-400">
          AWS Student Builder Group – TIP Manila
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
          ID Generator
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
          Internal ID management and generation system for authorized AWS SBG
          TIP Manila officers.
        </p>
        <Link className="btn-primary mt-8 inline-flex" href="/login">
          Officer Login
        </Link>
      </section>
    </main>
  );
}

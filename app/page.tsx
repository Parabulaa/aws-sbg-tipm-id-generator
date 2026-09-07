export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-950">
      <section className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-600">
          AWS Student Builder Group · TIP Manila
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">ID Generator</h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-slate-600">
          Frontend prototype workspace for managing members and previewing organization IDs.
        </p>
      </section>
    </main>
  );
}

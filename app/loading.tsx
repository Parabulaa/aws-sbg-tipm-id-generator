export default function Loading() {
  return (
    <div
      className="min-h-screen bg-slate-50 p-6 lg:ml-[260px] lg:p-10"
      aria-label="Loading page"
    >
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-9 w-52 rounded-xl bg-slate-200" />
        <div className="mt-3 h-4 w-80 max-w-full rounded-full bg-slate-200" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-32 rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

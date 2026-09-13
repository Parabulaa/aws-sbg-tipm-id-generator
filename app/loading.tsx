export default function Loading() {
  return (
    <div
      className="route-loading-shell min-h-screen p-6 lg:ml-[240px] lg:p-10"
      aria-label="Loading page"
    >
      <div className="route-loading-content mx-auto max-w-7xl animate-pulse">
        <div className="route-loading-title h-9 w-52 rounded-xl" />
        <div className="route-loading-line mt-3 h-4 w-80 max-w-full rounded-full" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="route-loading-card h-32 rounded-2xl"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

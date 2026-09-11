import Link from 'next/link';

export default function Home() {
  return (
    <main className="internal-public-page">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between border-b border-[#9AD3E0]/15 py-4 sm:py-5">
          <Link href="/" className="leading-tight text-[#E0F2F5]">
            <span className="block text-base font-semibold">AWS SBG TIP Manila</span>
            <span className="mt-1 block text-sm text-[#9AD3E0]/70">ID Generator</span>
          </Link>
          <Link className="internal-nav-link" href="/login">Login</Link>
        </header>
        <section className="flex flex-1 items-center py-16 sm:py-20">
          <div className="max-w-3xl pb-12 sm:pb-16">
            <h1 className="internal-enter text-[2.25rem] font-semibold leading-[1.08] tracking-[-0.045em] text-[#E0F2F5] sm:text-5xl md:text-6xl">
              Welcome to the
              <span className="internal-gradient-text block">ID Generator.</span>
            </h1>
            <p className="internal-enter internal-enter-delay-1 mt-7 max-w-xl text-base leading-7 text-[#E0F2F5]/72 sm:text-lg sm:leading-8">
              An internal platform for managing and generating AWS SBG TIP Manila membership IDs.
            </p>
            <p className="internal-enter internal-enter-delay-1 mt-3 text-sm text-[#9AD3E0]/65">Authorized officers only.</p>
            <Link className="internal-action internal-enter internal-enter-delay-2 mt-9" href="/login">
              <span>Login</span><span className="internal-action-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

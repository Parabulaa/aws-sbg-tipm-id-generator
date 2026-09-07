import type { ReactNode } from 'react';
import { Sidebar } from '@/components/sidebar';

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Sidebar />
      <main className="min-w-0 p-5 sm:p-8 lg:ml-[260px] lg:p-10">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

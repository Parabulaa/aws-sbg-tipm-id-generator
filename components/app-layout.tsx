'use client';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="internal-app min-h-screen bg-slate-50 text-slate-950">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(value => !value)} />
      <main className={`min-w-0 p-4 transition-[margin] duration-200 sm:p-5 ${collapsed ? 'lg:ml-[76px]' : 'lg:ml-[240px]'}`}>
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

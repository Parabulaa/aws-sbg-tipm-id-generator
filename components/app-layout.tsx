'use client';
import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { Sidebar } from '@/components/sidebar';

const SIDEBAR_KEY = 'sidebar-collapsed';
const SIDEBAR_EVENT = 'sidebar-preference-change';
function subscribeSidebar(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(SIDEBAR_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(SIDEBAR_EVENT, callback);
  };
}
const sidebarSnapshot = () => window.localStorage.getItem(SIDEBAR_KEY) === 'true';
const serverSidebarSnapshot = () => false;

type AppLayoutProps = {
  children: ReactNode;
  fullWidth?: boolean;
};

export function AppLayout({ children, fullWidth = false }: AppLayoutProps) {
  const collapsed = useSyncExternalStore(subscribeSidebar, sidebarSnapshot, serverSidebarSnapshot);
  const toggleSidebar = () => {
    window.localStorage.setItem(SIDEBAR_KEY, String(!collapsed));
    window.dispatchEvent(new Event(SIDEBAR_EVENT));
  };
  return (
    <div className="internal-app min-h-screen bg-slate-50 text-slate-950">
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <main className={`min-w-0 p-4 transition-[margin] duration-200 sm:p-5 ${collapsed ? 'lg:ml-[76px]' : 'lg:ml-[240px]'}`}>
        <div className={`mx-auto w-full ${fullWidth ? 'max-w-none' : 'max-w-7xl'}`}>{children}</div>
      </main>
    </div>
  );
}

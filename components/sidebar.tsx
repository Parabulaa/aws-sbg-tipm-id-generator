'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BadgeCheck,
  FileBadge2,
  FolderCog,
  LayoutDashboard,
  Menu,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

const navigation = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Generate ID', href: '/generate-id', icon: Sparkles },
  { label: 'Members', href: '/members', icon: Users },
  { label: 'Templates', href: '/templates', icon: FolderCog },
  { label: 'Generated IDs', href: '/generated-ids', icon: FileBadge2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 p-4 backdrop-blur lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="grid size-11 place-items-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {mobileOpen ? <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] lg:hidden" /> : null}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/10 transition-transform duration-200 lg:z-20 lg:w-[260px] lg:translate-x-0 lg:shadow-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex items-center justify-between gap-3">
          <Brand />
          <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden">
            <X className="size-5" />
          </button>
        </div>

      <nav className="space-y-1" aria-label="Main navigation">
        {navigation.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;

          return (
          <Link
            key={label}
            href={href}
            onClick={() => setMobileOpen(false)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-amber-50 text-amber-800'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
            }`}
          >
            <Icon className="size-[18px]" />
            {label}
          </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-200 pt-4">
        <button type="button" title="Settings are not available in this prototype" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
          <Settings className="size-[18px]" />
          Settings
        </button>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
          <span className="grid size-10 place-items-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">AD</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">Admin User</p>
            <p className="truncate text-xs text-slate-500">Organization admin</p>
          </div>
          <BadgeCheck className="size-4 text-amber-600" />
        </div>
      </div>
    </aside>
    </>
  );
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-500 text-lg font-black text-white">AWS</span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">AWS SBG TIP Manila</p>
        <p className="text-sm text-slate-500">ID Generator</p>
      </div>
    </div>
  );
}

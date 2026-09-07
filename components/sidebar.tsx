'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BadgeCheck,
  FileBadge2,
  FolderCog,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
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

  return (
    <aside className="flex border-b border-slate-200 bg-white p-4 lg:fixed lg:inset-y-0 lg:left-0 lg:w-[260px] lg:flex-col lg:border-b-0 lg:border-r lg:p-5">
      <div className="flex min-w-0 items-center gap-3 lg:mb-8">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-500 text-lg font-black text-white">
          AWS
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">AWS SBG TIP Manila</p>
          <p className="text-sm text-slate-500">ID Generator</p>
        </div>
      </div>

      <nav className="hidden space-y-1 lg:block" aria-label="Main navigation">
        {navigation.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;

          return (
          <Link
            key={label}
            href={href}
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

      <div className="mt-auto hidden border-t border-slate-200 pt-4 lg:block">
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
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
  );
}

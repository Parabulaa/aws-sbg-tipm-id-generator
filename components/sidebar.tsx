'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  FileBadge2,
  FolderCog,
  LayoutDashboard,
  Menu,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useData } from './data-provider';
import { errorText } from '@/lib/client';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
const navigation = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Generate ID', href: '/generate-id', icon: Sparkles },
  { label: 'Members', href: '/members', icon: Users },
  { label: 'Templates', href: '/templates', icon: FolderCog },
  { label: 'Generated IDs', href: '/generated-ids', icon: FileBadge2 },
];
export function Sidebar() {
  const pathname = usePathname();
  const { user, role } = useData();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  function content() {
    return (
      <>
        <Brand />
        <nav className="mt-8 space-y-1" aria-label="Main navigation">
          {navigation.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={pathname === href ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${pathname === href ? 'bg-amber-50 text-amber-800' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Icon className="size-[18px]" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-slate-200 pt-4">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="break-words text-sm font-semibold">{user}</p>
            <p className="mt-0.5 text-xs capitalize text-slate-500">{role}</p>
            <button
              className="btn mt-2"
              onClick={async () => {
                try {
                  const { error } =
                    await getSupabaseBrowserClient().auth.signOut();
                  if (error) throw error;
                  window.location.assign('/');
                } catch (error) {
                  setError(errorText(error));
                }
              }}
            >
              Sign out
            </button>
          </div>
          {error && (
            <p role="alert" className="notice-error">
              {error}
            </p>
          )}
        </div>
      </>
    );
  }
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-slate-200 bg-white p-4 lg:hidden">
        <Brand />
        <button
          type="button"
          className="btn"
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" />
        </button>
      </header>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[260px] flex-col overflow-y-auto border-r border-slate-200 bg-white p-5 lg:flex">
        {content()}
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="max-w-[290px] p-5">
          <SheetTitle className="sr-only">Organization navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Choose a page in the ID generator.
          </SheetDescription>
          {content()}
        </SheetContent>
      </Sheet>
    </>
  );
}
function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-500 text-lg font-black text-white">
        AWS
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">AWS SBG TIP Manila</p>
        <p className="text-sm text-slate-500">ID Generator</p>
      </div>
    </div>
  );
}

'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type {
  MemberRecord,
  ColorSettings,
  Generation,
  Activity,
} from '@/lib/domain';
import type { Template } from '@/lib/templates';
import { api, ApiError, errorText } from '@/lib/client';
interface Data {
  members: MemberRecord[];
  colors: ColorSettings;
  generations: Generation[];
  activity: Activity[];
  templates: Template[];
  user: string;
  refresh: () => Promise<void>;
}
const Context = createContext<Data | null>(null);
export function useData() {
  const data = useContext(Context);
  if (!data) throw new Error('DataProvider is required');
  return data;
}
export function DataProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = pathname === '/' || pathname === '/login';
  const [data, setData] = useState<Omit<Data, 'refresh'> | null>(null);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      const session = await api<{ user: string }>('session');
      const [members, colors, generations, activity, templates] =
        await Promise.all([
          api<MemberRecord[]>('members'),
          api<ColorSettings>('colors'),
          api<Generation[]>('generations'),
          api<Activity[]>('activity'),
          api<Template[]>('templates'),
        ]);
      setData({
        members,
        colors,
        generations,
        activity,
        templates,
        user: session.user,
      });
      setError('');
    } catch (error) {
      setError(errorText(error));
      if (error instanceof ApiError && error.status === 401) {
        setData(null);
        router.replace('/login');
      }
      throw error;
    }
  }, [router]);
  useEffect(() => {
    if (isPublic) return;
    queueMicrotask(() => {
      void refresh().catch(() => {});
    });
  }, [isPublic, refresh]);
  if (isPublic) return children;
  if (!data)
    return (
      <main className="mx-auto max-w-lg p-8">
        <h1 className="text-2xl font-bold">AWS SBG TIP Manila</h1>
        {!error ? (
          <output className="mt-4 block">Loading records…</output>
        ) : (
          <button
            className="btn mt-4"
            onClick={() => void refresh().catch(() => {})}
          >
            Retry connection
          </button>
        )}
        {error && (
          <p role="alert" className="notice-error mt-4">
            {error}
          </p>
        )}
      </main>
    );
  return (
    <Context.Provider value={{ ...data, refresh }}>
      {error && (
        <div role="alert" className="notice-error">
          {error}
        </div>
      )}
      {children}
    </Context.Provider>
  );
}

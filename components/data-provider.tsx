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
import { memberForReview } from '@/lib/domain';
interface Data {
  members: MemberRecord[];
  colors: ColorSettings;
  generations: Generation[];
  activity: Activity[];
  templates: Template[];
  user: string;
  role: 'admin' | 'officer';
  loading: boolean;
  refresh: () => Promise<void>;
}
const Context = createContext<Data | null>(null);
const emptyData: Omit<Data, 'refresh'> = {
  members: [],
  colors: { mode: 'default', teams: [], revision: 0 },
  generations: [],
  activity: [],
  templates: [],
  user: 'Officer',
  role: 'officer',
  loading: true,
};
export function useData() {
  const data = useContext(Context);
  if (!data) throw new Error('DataProvider is required');
  return data;
}
export function DataProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = pathname === '/' || pathname === '/login';
  const [data, setData] = useState<Omit<Data, 'refresh'>>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      const session = await api<{
        user: string;
        role: 'admin' | 'officer';
      }>('session');
      const results = await Promise.allSettled([
        api<MemberRecord[]>('members'),
        api<ColorSettings>('colors'),
        api<Generation[]>('generations'),
        api<Activity[]>('activity'),
        api<Template[]>('templates'),
      ]);
      const [membersResult, colorsResult, generationsResult, activityResult, templatesResult] = results;
      const firstError = results.find(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      )?.reason;
      setData({
        members: membersResult.status === 'fulfilled' ? membersResult.value.map(memberForReview) : [],
        colors: colorsResult.status === 'fulfilled' ? colorsResult.value : emptyData.colors,
        generations: generationsResult.status === 'fulfilled' ? generationsResult.value : [],
        activity: activityResult.status === 'fulfilled' ? activityResult.value : [],
        templates: templatesResult.status === 'fulfilled' ? templatesResult.value : [],
        user: session.user,
        role: session.role,
        loading: false,
      });
      setError(firstError ? errorText(firstError) : '');
    } catch (error) {
      setError(errorText(error));
      if (error instanceof ApiError && error.status === 401) {
        router.replace('/login');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router]);
  useEffect(() => {
    if (isPublic) return;
    queueMicrotask(() => {
      void refresh().catch(() => {});
    });
  }, [isPublic, refresh]);
  if (isPublic) return children;
  return (
    <Context.Provider value={{ ...data, loading, refresh }}>
      {error && (
        <div role="alert" className="notice-error">
          {error}
        </div>
      )}
      {children}
    </Context.Provider>
  );
}

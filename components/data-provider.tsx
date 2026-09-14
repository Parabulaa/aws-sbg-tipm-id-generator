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
  email: string;
  id: string;
  mustChangePassword: boolean;
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
  email: '',
  id: '',
  mustChangePassword: false,
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
  const isPublic =
    pathname === '/' || pathname === '/login' || pathname === '/change-password';
  const [data, setData] = useState<Omit<Data, 'refresh'>>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      const bootstrap = await api<{
        session: {
          user: string;
          role: 'admin' | 'officer';
          email: string;
          id: string;
          must_change_password: boolean;
        };
        members?: MemberRecord[];
        colors?: ColorSettings;
        generations?: Generation[];
        activity?: Activity[];
        templates?: Template[];
        errors?: string[];
      }>('bootstrap');
      const session = bootstrap.session;
      if (session.must_change_password && pathname !== '/change-password') {
        router.replace('/change-password');
        setData({
          ...emptyData,
          user: session.user,
          role: session.role,
          email: session.email,
          id: session.id,
          mustChangePassword: true,
          loading: false,
        });
        return;
      }
      setData((previous) => ({
        members: bootstrap.members ? bootstrap.members.map(memberForReview) : previous.members,
        colors: bootstrap.colors ?? previous.colors,
        generations: bootstrap.generations ?? previous.generations,
        activity: bootstrap.activity ?? previous.activity,
        templates: bootstrap.templates ?? previous.templates,
        user: session.user,
        role: session.role,
        email: session.email,
        id: session.id,
        mustChangePassword: session.must_change_password,
        loading: false,
      }));
      setError(bootstrap.errors?.[0] ?? '');
    } catch (error) {
      setError(errorText(error));
      if (error instanceof ApiError && error.status === 401) {
        router.replace('/login');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);
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
        <div role="alert" className="app-toast-error">
          <strong>Action needed</strong>
          <span>{error}</span>
        </div>
      )}
      {children}
    </Context.Provider>
  );
}

'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { MemberRecord, ColorSettings, Generation, Activity } from '@/lib/domain';
import type { Template } from '@/lib/templates';
import { api, ApiError, errorText } from '@/lib/client';
interface Data {
  members: MemberRecord[]; colors: ColorSettings; generations: Generation[]; activity: Activity[]; templates: Template[];
  user: string; refresh: () => Promise<void>;
}
const Context = createContext<Data | null>(null);
export function useData() { const data = useContext(Context); if (!data) throw new Error('DataProvider is required'); return data; }
export function DataProvider({ children }: { children: ReactNode }) {
  const [data,setData] = useState<Omit<Data,'refresh'> | null>(null);
  const [error,setError] = useState(''); const [login,setLogin] = useState(false); const [busy,setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const session = await api<{user:string}>('session');
      const [members,colors,generations,activity,templates] = await Promise.all([
        api<MemberRecord[]>('members'),api<ColorSettings>('colors'),api<Generation[]>('generations'),api<Activity[]>('activity'),api<Template[]>('templates'),
      ]);
      setData({members,colors,generations,activity,templates,user:session.user}); setError(''); setLogin(false);
    } catch (error) { setError(errorText(error)); if (error instanceof ApiError && error.status === 401) { setData(null);setLogin(true); } throw error; }
  },[]);
  useEffect(() => { queueMicrotask(() => { void refresh().catch(() => {}); }); },[refresh]);
  if (!data) return <main className="mx-auto max-w-lg p-8">
    <h1 className="text-2xl font-bold">AWS SBG TIP Manila</h1>
    {login ? <form className="mt-6 space-y-4" onSubmit={async event => {
      event.preventDefault(); setBusy(true); const form=new FormData(event.currentTarget);
      try { await api('login',{method:'POST',body:JSON.stringify({email:form.get('email'),password:form.get('password')})}); await refresh(); }
      catch(error) {setError(errorText(error));} finally {setBusy(false);}
    }}>
      <h2 className="font-semibold">Officer sign in</h2>
      <label className="field">Email<input name="email" type="email" autoComplete="username" required /></label>
      <label className="field">Password<input name="password" type="password" autoComplete="current-password" required /></label>
      <button className="btn-primary" disabled={busy}>{busy?'Signing in…':'Sign in'}</button>
    </form> : !error ? <output className="mt-4 block">Loading records…</output> : <button className="btn mt-4" onClick={() => void refresh().catch(() => {})}>Retry connection</button>}
    {error && <p role="alert" className="notice-error mt-4">{error}</p>}
  </main>;
  return <Context.Provider value={{...data,refresh}}>{error && <div role="alert" className="notice-error">{error}</div>}{children}</Context.Provider>;
}

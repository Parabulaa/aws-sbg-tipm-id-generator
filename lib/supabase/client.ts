import { createClient } from '@supabase/supabase-js';

let browserClient: ReturnType<typeof createClient> | undefined;

export function browserSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  return { url, publishableKey, configured: Boolean(url && publishableKey) };
}

export function getSupabaseBrowserClient() {
  const { url, publishableKey, configured } = browserSupabaseConfig();
  if (!configured)
    throw new Error(
      'Supabase is not configured. Add the project URL and publishable key to .env.local.',
    );
  browserClient ??= createClient(url!, publishableKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return browserClient;
}

export async function getAccessToken() {
  const { data, error } = await getSupabaseBrowserClient().auth.getSession();
  if (error) throw error;
  return data.session?.access_token ?? null;
}

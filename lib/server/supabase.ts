import { createClient } from '@supabase/supabase-js';
import { AppError } from './errors';

export type OfficerRole = 'admin' | 'officer';
export interface OfficerProfile {
  id: string;
  email: string;
  display_name: string;
  role: OfficerRole;
  is_active: boolean;
  must_change_password: boolean;
  password_changed_at: string | null;
}
export interface SupabaseBindings {
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_SECRET_KEY?: string;
}

const RESERVED_ADMIN_EMAILS = new Set(['mjramba@tip.edu.ph']);

function normalizeOfficerProfile(profile: OfficerProfile): OfficerProfile {
  if (RESERVED_ADMIN_EMAILS.has(profile.email.trim().toLowerCase()))
    return { ...profile, role: 'admin', is_active: true };
  return profile;
}

export function bearerToken(request: Request) {
  const value = request.headers.get('Authorization');
  return value?.startsWith('Bearer ') ? value.slice(7).trim() : '';
}

export function assertOfficerRole(
  profile: OfficerProfile,
  required?: OfficerRole,
) {
  if (!profile.is_active)
    throw new AppError('This officer account is not active.', 403);
  if (required === 'admin' && profile.role !== 'admin')
    throw new AppError(
      'Administrator rights are required for this action.',
      403,
    );
}

export async function requireOfficer(
  request: Request,
  env: SupabaseBindings,
  required?: OfficerRole,
) {
  const url = env.SUPABASE_URL?.trim();
  const key = env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key)
    throw new AppError(
      'Supabase officer access is not configured for this installation.',
      503,
    );
  const token = bearerToken(request);
  if (!token) throw new AppError('Sign in to access officer records.', 401);
  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user)
    throw new AppError('Your session has expired. Sign in again.', 401);
  const { data: profile, error: profileError } = await client
    .from('officer_profiles')
    .select('id,email,display_name,role,is_active,must_change_password,password_changed_at')
    .eq('id', authData.user.id)
    .maybeSingle<OfficerProfile>();
  if (profileError)
    throw new AppError('Officer access could not be verified.', 403);
  if (!profile)
    throw new AppError(
      'Your account does not have an officer profile. Contact an administrator.',
      403,
    );
  const normalizedProfile = normalizeOfficerProfile(profile);
  assertOfficerRole(normalizedProfile, required);
  return {
    client,
    user: authData.user,
    profile: normalizedProfile,
    actor: normalizedProfile.display_name.trim() || normalizedProfile.email,
    token,
  };
}

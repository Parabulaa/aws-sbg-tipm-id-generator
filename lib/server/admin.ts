import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppError } from './errors';
import type { OfficerProfile, SupabaseBindings } from './supabase';

export type OfficerAccount = OfficerProfile & {
  created_at?: string;
  updated_at?: string;
};

export interface AdminActivityLog {
  id: string;
  user_id: string | null;
  user_name: string;
  user_role: 'admin' | 'officer';
  action: string;
  status: string;
  target_user_id: string | null;
  created_at: string;
}

function text(value: unknown, label: string, max = 160) {
  if (typeof value !== 'string') throw new AppError(`${label} is required.`);
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > max)
    throw new AppError(`${label} is required.`);
  return cleaned;
}

function role(value: unknown) {
  if (value !== 'admin' && value !== 'officer')
    throw new AppError('Select a valid officer role.');
  return value;
}

export function serviceClient(env: SupabaseBindings) {
  const url = env.SUPABASE_URL?.trim();
  const key = env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key)
    throw new AppError(
      'Server-side Supabase admin access is not configured.',
      503,
    );
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function listOfficers(client: SupabaseClient) {
  const preferred = await client
    .from('officer_profiles')
    .select(
      'id,email,display_name,role,is_active,must_change_password,password_changed_at,created_at,updated_at',
    )
    .order('display_name');
  if (!preferred.error) return (preferred.data ?? []) as OfficerAccount[];
  const fallback = await client
    .from('officer_profiles')
    .select('id,email,display_name,role,is_active,created_at,updated_at')
    .order('display_name');
  if (fallback.error) throw new AppError('Officer accounts could not be loaded.');
  return (fallback.data ?? []).map((account) => ({
    ...account,
    must_change_password: false,
    password_changed_at: null,
  })) as OfficerAccount[];
}

async function preventNoActiveAdmin(
  client: SupabaseClient,
  targetId: string,
  nextRole: 'admin' | 'officer',
  nextActive: boolean,
) {
  const { data, error } = await client
    .from('officer_profiles')
    .select('id')
    .eq('role', 'admin')
    .eq('is_active', true);
  if (error) throw new AppError('Administrator safety check failed.');
  const remaining = (data ?? []).filter((row) => row.id !== targetId).length;
  if ((!nextActive || nextRole !== 'admin') && remaining < 1)
    throw new AppError('At least one active administrator must remain.', 409);
}

export async function createOfficerAccount(
  client: SupabaseClient,
  env: SupabaseBindings,
  actor: OfficerProfile,
  request: Request,
) {
  const body = (await request.json()) as Record<string, unknown>;
  const displayName = text(body.display_name, 'Display name', 120);
  const email = text(body.email, 'Email', 180).toLowerCase();
  const password = text(body.password, 'Temporary password', 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new AppError('Enter a valid officer email.');
  if (password.length < 8)
    throw new AppError('Temporary password must be at least 8 characters.');

  const admin = serviceClient(env);
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (created.error || !created.data.user)
    throw new AppError(created.error?.message || 'Officer account could not be created.', 400);

  const { data, error } = await admin
    .from('officer_profiles')
    .upsert({
      id: created.data.user.id,
      email,
      display_name: displayName,
      role: 'officer',
      is_active: true,
      must_change_password: true,
      updated_at: new Date().toISOString(),
    })
    .select('id,email,display_name,role,is_active,must_change_password,password_changed_at,created_at,updated_at')
    .single();
  if (error) throw new AppError('Officer profile could not be saved.');
  await logAdminActivity(client, actor, 'Created officer account', 'Success', data.id);
  return data as OfficerAccount;
}

export async function updateOfficerAccount(
  client: SupabaseClient,
  env: SupabaseBindings,
  actor: OfficerProfile,
  officerId: string,
  request: Request,
) {
  const body = (await request.json()) as Record<string, unknown>;
  const displayName = text(body.display_name, 'Display name', 120);
  const email = text(body.email, 'Email', 180).toLowerCase();
  const nextRole = role(body.role);
  const isActive = Boolean(body.is_active);
  const mustChangePassword = Boolean(body.must_change_password);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new AppError('Enter a valid officer email.');
  await preventNoActiveAdmin(client, officerId, nextRole, isActive);

  const admin = serviceClient(env);
  const updatedAuth = await admin.auth.admin.updateUserById(officerId, { email });
  if (updatedAuth.error)
    throw new AppError(updatedAuth.error.message || 'Officer auth account could not be updated.', 400);

  const { data, error } = await admin
    .from('officer_profiles')
    .update({
      display_name: displayName,
      email,
      role: nextRole,
      is_active: isActive,
      must_change_password: mustChangePassword,
      updated_at: new Date().toISOString(),
    })
    .eq('id', officerId)
    .select('id,email,display_name,role,is_active,must_change_password,password_changed_at,created_at,updated_at')
    .single();
  if (error) throw new AppError('Officer access could not be updated.');
  await logAdminActivity(client, actor, 'Updated officer access', 'Success', officerId);
  return data as OfficerAccount;
}

export async function changeOwnPassword(
  client: SupabaseClient,
  env: SupabaseBindings,
  actor: OfficerProfile,
  request: Request,
) {
  const body = (await request.json()) as Record<string, unknown>;
  const password = text(body.password, 'New password', 120);
  if (password.length < 8)
    throw new AppError('New password must be at least 8 characters.');
  const admin = serviceClient(env);
  const updatedAuth = await admin.auth.admin.updateUserById(actor.id, { password });
  if (updatedAuth.error)
    throw new AppError(updatedAuth.error.message || 'Password could not be updated.', 400);
  const changedAt = new Date().toISOString();
  const { error } = await admin
    .from('officer_profiles')
    .update({
      must_change_password: false,
      password_changed_at: changedAt,
      updated_at: changedAt,
    })
    .eq('id', actor.id);
  if (error) throw new AppError('Password was changed but profile status could not be updated.');
  await logAdminActivity(client, actor, 'Changed password');
  return { ok: true };
}

export async function listAdminActivity(client: SupabaseClient) {
  const { data, error } = await client
    .from('activity_logs')
    .select('id,user_id,user_name,user_role,action,status,target_user_id,created_at')
    .order('created_at', { ascending: false })
    .limit(250);
  if (error) throw new AppError('Activity logs could not be loaded.');
  return (data ?? []) as AdminActivityLog[];
}

export async function logAdminActivity(
  client: SupabaseClient,
  actor: OfficerProfile,
  action: string,
  status = 'Success',
  targetUserId: string | null = null,
) {
  const { error } = await client.from('activity_logs').insert({
    user_id: actor.id,
    user_name: actor.display_name || actor.email,
    user_role: actor.role,
    action,
    status,
    target_user_id: targetUserId,
  });
  if (error) console.warn('Admin activity could not be logged', error);
}

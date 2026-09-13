import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppError } from './errors';
import { normalizeOfficerProfile } from './supabase';
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
  target_name?: string | null;
  details?: Record<string, unknown>;
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
  const key =
    env.SUPABASE_SECRET_KEY?.trim() ||
    env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    env.SUPABASE_SERVICE_KEY?.trim();
  if (!url || !key)
    throw new AppError(
      'Server-side Supabase admin access is not configured. Add SUPABASE_SERVICE_ROLE_KEY in your deployment environment.',
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
  if (!preferred.error)
    return ((preferred.data ?? []) as OfficerAccount[]).map(normalizeOfficerProfile);
  const fallback = await client
    .from('officer_profiles')
    .select('id,email,display_name,role,is_active,created_at,updated_at')
    .order('display_name');
  if (fallback.error) throw new AppError('Officer accounts could not be loaded.');
  return (fallback.data ?? []).map((account) =>
    normalizeOfficerProfile({
      ...account,
      must_change_password: false,
      password_changed_at: null,
    } as OfficerAccount),
  ) as OfficerAccount[];
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
  const mustChangePassword = body.must_change_password !== false;
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
      must_change_password: mustChangePassword,
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

  const current = await client
    .from('officer_profiles')
    .select('email,display_name,role,is_active')
    .eq('id', officerId)
    .maybeSingle<{
      email: string;
      display_name: string;
      role: 'admin' | 'officer';
      is_active: boolean;
    }>();
  if (current.error || !current.data)
    throw new AppError('Officer account could not be loaded.');
  if (current.data.email.toLowerCase() !== email) {
    const admin = serviceClient(env);
    const updatedAuth = await admin.auth.admin.updateUserById(officerId, { email });
    if (updatedAuth.error)
      throw new AppError(updatedAuth.error.message || 'Officer auth account could not be updated.', 400);
  }

  const changes: Record<string, unknown> = {
    display_name: displayName,
    email,
    role: nextRole,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };
  const passwordFields = await client
    .from('officer_profiles')
    .select('must_change_password')
    .eq('id', officerId)
    .maybeSingle<{ must_change_password: boolean }>();
  if (!passwordFields.error) changes.must_change_password = mustChangePassword;

  const { data, error } = await client
    .from('officer_profiles')
    .update(changes)
    .eq('id', officerId)
    .select('id,email,display_name,role,is_active,created_at,updated_at')
    .single();
  if (error) {
    console.error('Admin operation failed:', {
      operation: 'update_officer_profile',
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    await logAdminActivity(
      client,
      actor,
      `Failed to update ${displayName}'s account`,
      'Failed',
      officerId,
      displayName,
    );
    throw new AppError(
      error.code === '42501'
        ? 'Supabase rejected this update. Confirm your admin role migration is applied.'
        : 'Officer access could not be updated.',
    );
  }
  const actions = describeOfficerChanges(current.data, {
    display_name: displayName,
    role: nextRole,
    is_active: isActive,
    previous_must_change_password: !passwordFields.error
      ? passwordFields.data?.must_change_password ?? false
      : false,
    must_change_password: mustChangePassword,
  });
  await Promise.all(
    actions.map((message) =>
      logAdminActivity(client, actor, message, 'Success', officerId, displayName),
    ),
  );
  return normalizeOfficerProfile({
    ...data,
    must_change_password: !passwordFields.error ? mustChangePassword : false,
    password_changed_at: null,
  } as OfficerAccount);
}

function displayRole(value: 'admin' | 'officer') {
  return value === 'admin' ? 'Admin' : 'Officer';
}

function describeOfficerChanges(
  previous: {
    display_name: string;
    role: 'admin' | 'officer';
    is_active: boolean;
  },
  next: {
    display_name: string;
    role: 'admin' | 'officer';
    is_active: boolean;
    previous_must_change_password: boolean;
    must_change_password: boolean;
  },
) {
  const name = next.display_name || previous.display_name || 'User';
  const messages: string[] = [];
  if (previous.display_name !== next.display_name)
    messages.push(`Changed ${previous.display_name || 'user'}'s display name to ${next.display_name}`);
  if (previous.role !== next.role)
    messages.push(`Changed ${name}'s role from ${displayRole(previous.role)} to ${displayRole(next.role)}`);
  if (previous.is_active !== next.is_active)
    messages.push(`${next.is_active ? 'Activated' : 'Deactivated'} ${name}'s account`);
  if (next.previous_must_change_password !== next.must_change_password)
    messages.push(
      `${next.must_change_password ? 'Required' : 'Cleared requirement for'} ${name} to change password`,
    );
  return messages.length ? messages : [`Updated ${name}'s account`];
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
    .select('id,user_id,user_name,user_role,action,status,target_user_id,target_name,details,created_at')
    .order('created_at', { ascending: false })
    .limit(250);
  if (error) {
    const message = `${error.message ?? ''} ${error.code ?? ''}`;
    if (
      message.includes('activity_logs') ||
      message.includes('does not exist') ||
      message.includes('PGRST') ||
      message.includes('42P01')
    )
      return [];
    throw new AppError('Activity logs could not be loaded.');
  }
  return (data ?? []) as AdminActivityLog[];
}

export async function logAdminActivity(
  client: SupabaseClient,
  actor: OfficerProfile,
  action: string,
  status = 'Success',
  targetUserId: string | null = null,
  targetName: string | null = null,
  details: Record<string, unknown> = {},
) {
  const { error } = await client.from('activity_logs').insert({
    user_id: actor.id,
    user_name: actor.display_name || actor.email,
    user_role: actor.role,
    action,
    status,
    target_user_id: targetUserId,
    target_name: targetName,
    details,
  });
  if (error)
    console.warn('Admin activity could not be logged', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
}

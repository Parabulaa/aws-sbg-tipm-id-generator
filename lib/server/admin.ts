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
  actor_email?: string;
  category?: string;
  target_type?: string | null;
  target_id?: string | null;
  description?: string;
  metadata?: Record<string, unknown>;
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
  const url =
    env.SUPABASE_URL?.trim() ||
    env.NEXT_PUBLIC_SUPABASE_URL?.trim();
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
  await logAdminActivity(
    client,
    actor,
    'officer_created',
    'Success',
    data.id,
    displayName,
    { category: 'account', target_type: 'officer', description: `${actor.display_name || actor.email} created Officer account ${displayName}.` },
  );
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
  const nextPassword =
    typeof body.password === 'string' && body.password.trim()
      ? body.password.trim()
      : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new AppError('Enter a valid officer email.');
  if (nextPassword && nextPassword.length < 8)
    throw new AppError('Temporary password must be at least 8 characters.');
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
  if (current.data.email.toLowerCase() !== email || nextPassword) {
    const admin = serviceClient(env);
    const authChanges: { email?: string; password?: string; email_confirm?: boolean } = {};
    if (current.data.email.toLowerCase() !== email) {
      authChanges.email = email;
      authChanges.email_confirm = true;
    }
    if (nextPassword) authChanges.password = nextPassword;
    const updatedAuth = await admin.auth.admin.updateUserById(officerId, authChanges);
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
    email,
    role: nextRole,
    is_active: isActive,
    previous_must_change_password: !passwordFields.error
      ? passwordFields.data?.must_change_password ?? false
      : false,
    must_change_password: mustChangePassword,
  });
  if (nextPassword)
    actions.push({ action: 'temporary_password_assigned', category: 'security', description: `${actor.display_name || actor.email} assigned a temporary password to ${displayName}.` });
  await Promise.all(
    actions.map((event) =>
      logAdminActivity(client, actor, event.action, 'Success', officerId, displayName, {
        category: event.category,
        target_type: 'officer',
        description: event.description,
      }),
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
    email: string;
    display_name: string;
    role: 'admin' | 'officer';
    is_active: boolean;
  },
  next: {
    display_name: string;
    email: string;
    role: 'admin' | 'officer';
    is_active: boolean;
    previous_must_change_password: boolean;
    must_change_password: boolean;
  },
) {
  const name = next.display_name || previous.display_name || 'User';
  const actorless = (description: string) => description;
  const messages: { action: string; category: string; description: string }[] = [];
  if (previous.display_name !== next.display_name)
    messages.push({ action: 'display_name_changed', category: 'account', description: actorless(`Changed ${previous.display_name || 'user'}'s display name to ${next.display_name}.`) });
  if (previous.email !== next.email)
    messages.push({ action: 'account_email_changed', category: 'account', description: actorless(`Changed ${name}'s email address.`) });
  if (previous.role !== next.role) {
    const action = next.role === 'admin' ? 'officer_promoted' : 'admin_demoted';
    messages.push({ action, category: 'security', description: actorless(`Changed ${name}'s role from ${displayRole(previous.role)} to ${displayRole(next.role)}.`) });
  }
  if (previous.is_active !== next.is_active)
    messages.push({ action: next.is_active ? 'account_activated' : 'account_deactivated', category: 'security', description: actorless(`${next.is_active ? 'Activated' : 'Deactivated'} ${name}'s account.`) });
  if (next.previous_must_change_password !== next.must_change_password)
    messages.push({ action: next.must_change_password ? 'force_password_change_enabled' : 'force_password_change_disabled', category: 'security', description: actorless(`${next.must_change_password ? 'Required' : 'Cleared requirement for'} ${name} to change password.`) });
  return messages.length ? messages : [{ action: 'account_updated', category: 'account', description: `Updated ${name}'s account.` }];
}

export async function changeOwnPassword(
  client: SupabaseClient,
  env: SupabaseBindings,
  actor: OfficerProfile,
  request: Request,
) {
  const body = (await request.json()) as Record<string, unknown>;
  const password = text(body.password, 'New password', 120);
  const voluntary = body.voluntary === true;
  if (password.length < 8)
    throw new AppError('New password must be at least 8 characters.');
  if (voluntary) {
    const currentPassword = text(body.current_password, 'Current password', 120);
    const url = env.SUPABASE_URL?.trim() || env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key =
      env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
    if (!url || !key)
      throw new AppError('Supabase password verification is not configured.', 503);
    const verifier = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const verified = await verifier.auth.signInWithPassword({
      email: actor.email,
      password: currentPassword,
    });
    if (verified.error)
      throw new AppError('Current password is incorrect.', 400);
    await verifier.auth.signOut({ scope: 'local' });
  }
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
  await logAdminActivity(
    client,
    actor,
    'password_changed',
    'Success',
    actor.id,
    actor.display_name || actor.email,
    { category: 'security', description: `${actor.display_name || actor.email} changed their password.` },
  );
  return { ok: true };
}

export async function listAdminActivity(client: SupabaseClient) {
  const structuredLogs = await client
    .from('activity_logs')
    .select('id,user_id,user_name,user_role,action,status,target_user_id,target_name,details,created_at,actor_email,category,target_type,target_id,description,metadata')
    .order('created_at', { ascending: false })
    .limit(250);
  let adminRows: AdminActivityLog[] = [];
  if (structuredLogs.error) {
    const legacyLogs = await client
      .from('activity_logs')
      .select('id,user_id,user_name,user_role,action,status,target_user_id,target_name,details,created_at')
      .order('created_at', { ascending: false })
      .limit(250);
    if (!legacyLogs.error) adminRows = (legacyLogs.data ?? []) as AdminActivityLog[];
    else {
      const message = `${legacyLogs.error.message ?? ''} ${legacyLogs.error.code ?? ''}`;
      if (
        message.includes('activity_logs') ||
        message.includes('does not exist') ||
        message.includes('PGRST') ||
        message.includes('42P01')
      ) adminRows = [];
      else throw new AppError('Activity logs could not be loaded.');
    }
  } else adminRows = (structuredLogs.data ?? []) as AdminActivityLog[];

  const activities = await client
    .from('activities')
    .select('id,action,metadata,created_at,actor_id,member_id')
    .order('created_at', { ascending: false })
    .limit(250);
  let rawActivityRows = activities.data ?? [];
  if (activities.error) {
    const message = `${activities.error.message ?? ''} ${activities.error.code ?? ''}`;
    if (
      message.includes('activities') ||
      message.includes('does not exist') ||
      message.includes('PGRST') ||
      message.includes('42P01')
    )
      rawActivityRows = [];
    else
    throw new AppError('Activity logs could not be loaded.');
  }

  const actorIds = [...new Set(rawActivityRows.map((row) => row.actor_id as string).filter(Boolean))];
  const memberIds = [...new Set(rawActivityRows.map((row) => row.member_id as string).filter(Boolean))];
  const [profiles, members] = await Promise.all([
    actorIds.length ? client.from('officer_profiles').select('id,email,display_name,role').in('id', actorIds) : Promise.resolve({ data: [], error: null }),
    memberIds.length ? client.from('members').select('id,full_name,aws_sbg_id').in('id', memberIds) : Promise.resolve({ data: [], error: null }),
  ]);
  const profileMap = new Map((profiles.data ?? []).map((profile) => [profile.id as string, profile]));
  const memberMap = new Map((members.data ?? []).map((member) => [member.id as string, member]));
  const categoryFor = (action: string) =>
    action.includes('template') ? 'templates' :
      action.includes('color') ? 'configuration' :
        action.includes('generation') || action.includes('generated') ? 'id_generation' : 'members';
  const activityRows: AdminActivityLog[] = rawActivityRows.map((row) => {
    const metadata =
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {};
    const message =
      typeof metadata.message === 'string' && metadata.message.trim()
        ? metadata.message.trim()
        : String(row.action).replaceAll('_', ' ');
    const profile = profileMap.get(row.actor_id as string);
    const member = memberMap.get(row.member_id as string);
    const action = String(row.action);
    return {
      id: `activity-${row.id as string}`,
      user_id: (row.actor_id as string | null) ?? null,
      user_name: String(profile?.display_name || profile?.email || 'Officer'),
      user_role: (profile?.role === 'admin' ? 'admin' : 'officer'),
      actor_email: String(profile?.email || ''),
      action,
      category: categoryFor(action),
      target_type: row.member_id ? 'member' : null,
      target_id: (row.member_id as string | null) ?? null,
      description: message,
      status: 'Success',
      target_user_id: null,
      target_name: member ? String(member.full_name || member.aws_sbg_id) : null,
      details: metadata,
      created_at: row.created_at as string,
    };
  });

  return [...adminRows, ...activityRows]
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() -
        new Date(left.created_at).getTime(),
    )
    .slice(0, 250);
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
  const category = typeof details.category === 'string' ? details.category : 'account';
  const targetType = typeof details.target_type === 'string' ? details.target_type : targetUserId ? 'officer' : null;
  const description = typeof details.description === 'string' ? details.description : action.replaceAll('_', ' ');
  const metadata = Object.fromEntries(
    Object.entries(details).filter(([key]) => !['category', 'target_type', 'description'].includes(key)),
  );
  const { error } = await client.from('activity_logs').insert({
    user_id: actor.id,
    user_name: actor.display_name || actor.email,
    user_role: actor.role,
    action,
    status,
    target_user_id: targetUserId,
    target_name: targetName,
    details,
    actor_user_id: actor.id,
    actor_name: actor.display_name || actor.email,
    actor_email: actor.email,
    actor_role: actor.role,
    category,
    target_type: targetType,
    target_id: targetUserId,
    description,
    metadata,
  });
  if (error)
    console.warn('Admin activity could not be logged', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
}

import { env } from 'cloudflare:workers';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Activity, ColorSettings, MemberRecord } from '../domain';
import { AppError } from './errors';
export { AppError } from './errors';

export interface Bindings {
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_SECRET_KEY?: string;
}

export function bindings(): Bindings {
  return env as unknown as Bindings;
}

export const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

export async function getMembers(
  client: SupabaseClient,
  includeArchived = false,
) {
  let query = client.from('members').select('*').order('aws_sbg_id');
  if (!includeArchived) query = query.is('archived_at', null);
  const { data, error } = await query;
  if (error) throw new AppError('Member records could not be loaded.');
  return data as MemberRecord[];
}

export async function getMember(client: SupabaseClient, id: string) {
  const { data, error } = await client
    .from('members')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new AppError('Member record could not be loaded.');
  if (!data) throw new AppError('Member not found.', 404);
  return data as MemberRecord;
}

export async function getColors(
  client: SupabaseClient,
): Promise<ColorSettings> {
  const { data, error } = await client
    .from('app_settings')
    .select('value,revision')
    .eq('key', 'officer_team_colors')
    .maybeSingle();
  if (error) throw new AppError('Color settings could not be loaded.');
  const value = (data?.value ?? { mode: 'default', teams: [] }) as Omit<
    ColorSettings,
    'revision'
  >;
  return { ...value, revision: data?.revision ?? 0 };
}

export async function getActivity(client: SupabaseClient) {
  const { data, error } = await client
    .from('activities')
    .select('id,member_id,action,metadata,created_at')
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw new AppError('Activity could not be loaded.');
  return (data ?? []).map((row) => ({
    id: row.id as string,
    member_id: row.member_id as string | null,
    message:
      typeof row.metadata === 'object' &&
      row.metadata &&
      'message' in row.metadata &&
      typeof row.metadata.message === 'string'
        ? row.metadata.message
        : String(row.action),
    created_at: row.created_at as string,
  })) satisfies Activity[];
}

export function checkRevision(member: MemberRecord, revision: unknown) {
  if (member.revision !== revision)
    throw new AppError(
      'This member changed in another session. Refresh and review the latest information.',
      409,
    );
}

const writableMemberFields = [
  'full_name',
  'tip_email',
  'student_id_number',
  'program',
  'year_level',
  'membership_type',
  'officer_position',
  'team',
  'photo_path',
  'photo_crop_data',
  'color_override',
  'date_issued',
  'valid_until',
  'status',
  'archived_at',
] as const;

export async function saveMember(
  client: SupabaseClient,
  actorId: string,
  previous: MemberRecord,
  updated: MemberRecord,
) {
  const changes: Record<string, unknown> = {
    revision: previous.revision + 1,
    updated_by: actorId,
    updated_at: new Date().toISOString(),
  };
  for (const field of writableMemberFields) changes[field] = updated[field];
  const { data, error } = await client
    .from('members')
    .update(changes)
    .eq('id', previous.id)
    .eq('revision', previous.revision)
    .select('*')
    .maybeSingle();
  if (error) {
    if (error.code === '23505')
      throw new AppError(
        'Email or student ID already belongs to a member.',
        409,
      );
    throw new AppError('The member could not be saved.');
  }
  if (!data)
    throw new AppError(
      'This member changed in another session. Refresh before saving.',
      409,
    );
  return data as MemberRecord;
}

export async function logActivity(
  client: SupabaseClient,
  actorId: string,
  action: string,
  message: string,
  memberId: string | null = null,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await client.from('activities').insert({
    actor_id: actorId,
    member_id: memberId,
    action,
    metadata: { ...metadata, message },
  });
  if (error)
    throw new AppError('The action was saved but could not be logged.');
}

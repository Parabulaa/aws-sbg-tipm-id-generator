import type { SupabaseClient } from '@supabase/supabase-js';
import {
  defaultCrop,
  normalizeMember,
  validateMember,
  reviewStatus,
  displayName,
} from '../domain';
import type { MemberRecord, Crop } from '../domain';
import {
  AppError,
  getMember,
  saveMember,
  checkRevision,
  json,
  logActivity,
} from './database';
import type { Bindings } from './database';

export async function importMembers(
  client: SupabaseClient,
  actorId: string,
  raw: unknown,
  manual = false,
) {
  if (!Array.isArray(raw) || !raw.length || raw.length > 500)
    throw new AppError('Import 1–500 valid records at a time.');
  const members = raw.map((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row))
      throw new AppError(`Row ${index + 1}: invalid member record.`);
    const member = normalizeMember(row as Record<string, unknown>);
    const errors = validateMember(member);
    if (errors.length)
      throw new AppError(`Row ${index + 1}: ${errors.join('; ')}`);
    return member;
  });
  const { data, error } = await client.rpc('create_members', {
    member_rows: members,
    actor: actorId,
    action_name: manual ? 'member_created' : 'member_imported',
  });
  if (error) {
    if (error.code === '23505')
      throw new AppError(
        'A T.I.P. email or student ID already belongs to a member.',
        409,
      );
    throw new AppError(error.message || 'Members could not be imported.');
  }
  return json(
    { imported: (data as MemberRecord[]).length, members: data },
    201,
  );
}

export async function updateMember(
  client: SupabaseClient,
  actorId: string,
  id: string,
  request: Request,
) {
  const previous = await getMember(client, id);
  const raw = (await request.json()) as Record<string, unknown>;
  checkRevision(previous, raw.revision);
  const input = normalizeMember(raw);
  if (Object.values(input).some((value) => value.length > 240))
    throw new AppError('Fields must be 240 characters or fewer.');
  const crop = raw.photo_crop_data as Crop;
  if (
    !crop ||
    ![crop.x, crop.y, crop.zoom].every(Number.isFinite) ||
    crop.x < 0 ||
    crop.x > 1 ||
    crop.y < 0 ||
    crop.y > 1 ||
    crop.zoom < 1 ||
    crop.zoom > 4
  )
    throw new AppError('Invalid photo position.');
  if (
    raw.color_override !== null &&
    (typeof raw.color_override !== 'string' ||
      !/^#[a-f\d]{6}$/i.test(raw.color_override))
  )
    throw new AppError('Invalid officer color.');
  const member: MemberRecord = {
    ...previous,
    ...input,
    photo_crop_data: crop,
    color_override:
      input.membership_type === 'Officer'
        ? (raw.color_override as string | null)
        : null,
    status: reviewStatus(input, previous.photo_path),
  };
  const saved = await saveMember(client, actorId, previous, member);
  await logActivity(
    client,
    actorId,
    'member_updated',
    `Member updated: ${displayName(saved)}`,
    saved.id,
  );
  return json(saved);
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result.toISOString().slice(0, 10);
}

export async function confirmMember(
  client: SupabaseClient,
  actorId: string,
  env: Bindings,
  id: string,
  request: Request,
) {
  const previous = await getMember(client, id);
  checkRevision(
    previous,
    ((await request.json()) as { revision: number }).revision,
  );
  const errors = validateMember(previous);
  if (errors.length || !previous.photo_path)
    throw new AppError(
      [
        ...errors,
        ...(!previous.photo_path ? ['Upload and review a photo first.'] : []),
      ].join('; '),
    );
  if (!(await env.FILES.head(previous.photo_path)))
    throw new AppError('Photo is missing. Please upload it again.');
  const issue = previous.date_issued ?? new Date().toISOString().slice(0, 10);
  let validityMonths = 12;
  const setting = await client
    .from('app_settings')
    .select('value')
    .eq('key', 'id_validity_months')
    .maybeSingle();
  if (setting.error)
    throw new AppError('ID validity configuration could not be loaded.');
  if (typeof setting.data?.value === 'number')
    validityMonths = setting.data.value;
  const saved = await saveMember(client, actorId, previous, {
    ...previous,
    date_issued: issue,
    valid_until:
      previous.valid_until ??
      addMonths(new Date(`${issue}T00:00:00Z`), validityMonths),
    status: 'Ready',
  });
  await logActivity(
    client,
    actorId,
    'member_confirmed',
    `ID confirmed: ${saved.aws_sbg_id}`,
    saved.id,
  );
  return json(saved);
}

export function pngDimensions(bytes: Uint8Array) {
  if (
    bytes.length < 24 ||
    [137, 80, 78, 71, 13, 10, 26, 10].some((byte, i) => bytes[i] !== byte)
  )
    throw new AppError('A PNG image is required.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

export async function photo(
  client: SupabaseClient,
  actorId: string,
  env: Bindings,
  id: string,
  request: Request,
) {
  const previous = await getMember(client, id);
  if (request.method === 'DELETE') {
    checkRevision(
      previous,
      ((await request.json()) as { revision: number }).revision,
    );
    const member = await saveMember(client, actorId, previous, {
      ...previous,
      photo_path: null,
      photo_crop_data: { ...defaultCrop },
      status: reviewStatus(previous, null),
    });
    await logActivity(
      client,
      actorId,
      'photo_removed',
      `Photo removed: ${displayName(previous)}`,
      previous.id,
    );
    return json(member);
  }
  const form = await request.formData();
  checkRevision(previous, Number(form.get('revision')));
  const file = form.get('photo');
  const crop = JSON.parse(
    (form.get('crop') as string) || JSON.stringify(defaultCrop),
  ) as Crop;
  if (
    !crop ||
    ![crop.x, crop.y, crop.zoom].every(Number.isFinite) ||
    crop.x < 0 ||
    crop.x > 1 ||
    crop.y < 0 ||
    crop.y > 1 ||
    crop.zoom < 1 ||
    crop.zoom > 4
  )
    throw new AppError('Invalid photo crop.');
  if (!(file instanceof File) || file.size > 8 * 1024 * 1024)
    throw new AppError('Upload an image smaller than 8 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const size = pngDimensions(bytes);
  if (
    size.width > 4096 ||
    size.height > 4096 ||
    size.width < 100 ||
    size.height < 100
  )
    throw new AppError('Photo must be 100–4096 pixels on each side.');
  const key = `photos/${id}/${crypto.randomUUID()}.png`;
  await env.FILES.put(key, bytes, {
    httpMetadata: { contentType: 'image/png' },
  });
  try {
    const saved = await saveMember(client, actorId, previous, {
      ...previous,
      photo_path: key,
      photo_crop_data: crop,
      status: reviewStatus(previous, key),
    });
    await logActivity(
      client,
      actorId,
      previous.photo_path ? 'photo_replaced' : 'photo_uploaded',
      `Photo ${previous.photo_path ? 'replaced' : 'uploaded'}: ${displayName(previous)}`,
      previous.id,
    );
    return json(saved);
  } catch (error) {
    await env.FILES.delete(key);
    throw error;
  }
}

export async function archiveMember(
  client: SupabaseClient,
  actorId: string,
  id: string,
  request: Request,
) {
  const previous = await getMember(client, id);
  checkRevision(
    previous,
    ((await request.json()) as { revision: number }).revision,
  );
  if (previous.archived_at) throw new AppError('Member is already archived.');
  const saved = await saveMember(client, actorId, previous, {
    ...previous,
    archived_at: new Date().toISOString(),
  });
  await logActivity(
    client,
    actorId,
    'member_archived',
    `Member archived: ${displayName(saved)}`,
    saved.id,
  );
  return json(saved);
}

export async function restoreMember(
  client: SupabaseClient,
  actorId: string,
  id: string,
  request: Request,
) {
  const previous = await getMember(client, id);
  checkRevision(
    previous,
    ((await request.json()) as { revision: number }).revision,
  );
  if (!previous.archived_at) throw new AppError('Member is not archived.');
  const saved = await saveMember(client, actorId, previous, {
    ...previous,
    archived_at: null,
  });
  await logActivity(
    client,
    actorId,
    'member_restored',
    `Member restored: ${displayName(saved)}`,
    saved.id,
  );
  return json(saved);
}

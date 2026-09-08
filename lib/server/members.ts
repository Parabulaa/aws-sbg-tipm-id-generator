import { defaultCrop, normalizeMember, validateMember, reviewStatus, displayName } from '../domain';
import type { MemberRecord, Crop } from '../domain';
import { AppError, getMember, saveMember, checkRevision, activity, json } from './database';
import type { Bindings } from './database';
export async function importMembers(env: Bindings, raw: unknown, manual = false) {
  if (!Array.isArray(raw) || !raw.length || raw.length > 500) throw new AppError('Import 1–500 valid records at a time.');
  const ids = new Set<string>();
  const records: MemberRecord[] = raw.map((row, index) => {
    const member = normalizeMember(row);
    const errors = validateMember(member);
    if (errors.length) throw new AppError(`Row ${index + 1}: ${errors.join('; ')}`);
    if (ids.has(member.aws_sbg_id)) throw new AppError(`Duplicate ID: ${member.aws_sbg_id}`);
    ids.add(member.aws_sbg_id);
    const now = new Date().toISOString();
    return { ...member, id: crypto.randomUUID(), photo_url: null, photo_crop_data: { ...defaultCrop }, color_override: null, status: 'Draft', revision: 1, created_at: now, updated_at: now };
  });
  const existing = await env.DB.prepare('SELECT aws_sbg_id FROM members').all<{ aws_sbg_id: string }>();
  const duplicates = records.filter(record => existing.results.some(row => row.aws_sbg_id === record.aws_sbg_id));
  if (duplicates.length) throw new AppError(`IDs already exist: ${duplicates.map(record => record.aws_sbg_id).join(', ')}`, 409);
  // D1 batch is transactional: a uniqueness race rolls back the complete import.
  await env.DB.batch(records.flatMap(member => [
    env.DB.prepare('INSERT INTO members (id, aws_sbg_id, data, status, revision) VALUES (?, ?, ?, ?, 1)').bind(member.id, member.aws_sbg_id, JSON.stringify(member), member.status),
    activity(env.DB, member.id, `${manual ? 'Member added' : 'Member imported'}: ${displayName(member)}`),
  ]));
  return json({ imported: records.length, members: records }, 201);
}
export async function updateMember(env: Bindings, id: string, request: Request) {
  const previous = await getMember(env.DB, id);
  const raw = await request.json() as Record<string, unknown>;
  checkRevision(previous, raw.revision);
  const input = normalizeMember(raw);
  if (!input.aws_sbg_id || !/^[A-Z0-9][A-Z0-9._-]{2,79}$/.test(input.aws_sbg_id)) throw new AppError('A valid AWS SBG ID is required.');
  if (Object.values(input).some(value => value.length > 240)) throw new AppError('Fields must be 240 characters or fewer.');
  if (!['Member','Officer','Associate'].includes(input.membership_type)) throw new AppError('Invalid membership type.');
  const crop = raw.photo_crop_data as Crop;
  if (!crop || ![crop.x, crop.y, crop.zoom].every(Number.isFinite) || crop.x < 0 || crop.x > 1 || crop.y < 0 || crop.y > 1 || crop.zoom < 1 || crop.zoom > 4) throw new AppError('Invalid photo position.');
  if (raw.color_override !== null && (typeof raw.color_override !== 'string' || !/^#[a-f\d]{6}$/i.test(raw.color_override))) throw new AppError('Invalid officer color.');
  const member: MemberRecord = { ...previous, ...input, photo_crop_data: crop, color_override: input.membership_type === 'Officer' ? raw.color_override as string | null : null, status: reviewStatus(input, previous.photo_url) };
  return json(await saveMember(env.DB, previous, member, `Member updated: ${displayName(member)}`));
}
export async function confirmMember(env: Bindings, id: string, request: Request) {
  const previous = await getMember(env.DB, id);
  checkRevision(previous, (await request.json() as { revision: number }).revision);
  const errors = validateMember(previous);
  if (errors.length || !previous.photo_url) throw new AppError([...errors, ...(!previous.photo_url ? ['Upload and review a photo first.'] : [])].join('; '));
  if (!await env.FILES.head(previous.photo_url)) throw new AppError('Photo is missing. Please upload it again.');
  return json(await saveMember(env.DB, previous, { ...previous, status: 'Ready' }, `ID confirmed: ${displayName(previous)}`));
}
export function pngDimensions(bytes: Uint8Array) {
  if (bytes.length < 24 || [137,80,78,71,13,10,26,10].some((byte,i) => bytes[i] !== byte)) throw new AppError('A PNG image is required.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}
export async function photo(env: Bindings, id: string, request: Request) {
  const previous = await getMember(env.DB, id);
  if (request.method === 'DELETE') {
    checkRevision(previous, (await request.json() as { revision: number }).revision);
    const member = await saveMember(env.DB, previous, { ...previous, photo_url: null, photo_crop_data: { ...defaultCrop }, status: reviewStatus(previous, null) }, `Photo removed: ${displayName(previous)}`);
    // Prior images remain available to immutable generation history snapshots.
    return json(member);
  }
  const form = await request.formData();
  checkRevision(previous, Number(form.get('revision')));
  const file = form.get('photo');
  if (!(file instanceof File) || file.size > 8 * 1024 * 1024) throw new AppError('Upload an image smaller than 8 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const size = pngDimensions(bytes);
  if (size.width > 4096 || size.height > 4096 || size.width < 100 || size.height < 100) throw new AppError('Photo must be 100–4096 pixels on each side.');
  const key = `photos/${id}/${crypto.randomUUID()}.png`;
  await env.FILES.put(key, bytes, { httpMetadata: { contentType: 'image/png' } });
  try { return json(await saveMember(env.DB, previous, { ...previous, photo_url: key, photo_crop_data: { ...defaultCrop }, status: reviewStatus(previous, key) }, `Photo uploaded: ${displayName(previous)}`)); }
  catch (error) { await env.FILES.delete(key); throw error; }
}

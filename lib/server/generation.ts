import type { SupabaseClient } from '@supabase/supabase-js';
import { accentColor, isArchived, memberForReview } from '../domain';
import type { Generation, MemberRecord } from '../domain';
import {
  AppError,
  getMember,
  getColors,
  checkRevision,
  json,
} from './database';
import { getTemplates } from './configuration';
import { pngDimensions } from './members';

export async function getGenerations(
  client: SupabaseClient,
): Promise<Generation[]> {
  const { data, error } = await client
    .from('generated_ids')
    .select(
      'id,member_id,member_snapshot,generated_at,generated_by,effective_accent,template_versions,front_path,back_path,pdf_path',
    )
    .order('generated_at', { ascending: false });
  if (error) throw new AppError('Generation history could not be loaded.');
  return (data ?? []).map((row) => {
    return {
      id: row.id as string,
      member_id: row.member_id as string,
      member: memberForReview(row.member_snapshot as MemberRecord),
      generated_at: row.generated_at as string,
      generated_by: 'Officer',
      accent: row.effective_accent as string,
      template_version: Object.values(
        row.template_versions as Record<string, string>,
      ).join(':'),
      status: 'Generated',
      front_path: row.front_path as string,
      back_path: row.back_path as string,
      pdf_path: row.pdf_path as string,
    };
  });
}

export async function generate(
  client: SupabaseClient,
  actorId: string,
  actorName: string,
  request: Request,
) {
  const form = await request.formData();
  const member = await getMember(client, form.get('member_id') as string);
  checkRevision(member, Number(form.get('revision')));
  if (isArchived(member))
    throw new AppError('Archived members cannot generate IDs.');
  if (member.status !== 'Ready')
    throw new AppError(
      'Only reviewed Ready members can be generated. Confirm this member first.',
    );
  const templates = (await getTemplates(client)).filter(
    (item) => item.category === member.membership_type,
  );
  const side = form.get('side') === 'front' ? 'front' : 'both';
  const requiredSides = side === 'front' ? (['front'] as const) : (['front', 'back'] as const);
  if (
    !requiredSides.every((templateSide) =>
      templates.some((item) => item.side === templateSide && item.approved),
    )
  )
    throw new AppError(
      side === 'front'
        ? 'An approved front template is required.'
        : 'Approved front and back templates are required.',
    );
  const versions = Object.fromEntries(
    requiredSides.map((templateSide) => [
      templateSide,
      templates.find((item) => item.side === templateSide)!.version,
    ]),
  );
  const version = requiredSides.map((templateSide) => versions[templateSide]).join(':');
  const colors = await getColors(client);
  if (
    form.get('template_version') !== version ||
    Number(form.get('color_revision')) !== colors.revision
  )
    throw new AppError(
      'Templates or colors changed. Refresh and regenerate.',
      409,
    );
  const files: Record<string, Uint8Array> = {};
  for (const name of side === 'front' ? ['front'] : ['front', 'back', 'pdf']) {
    const file = form.get(name);
    if (!(file instanceof File) || !file.size || file.size > 20 * 1024 * 1024)
      throw new AppError('Generated files are missing or too large.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (name !== 'pdf') {
      const size = pngDimensions(bytes);
      if (size.width !== 1200 || size.height !== 1950)
        throw new AppError('Export dimensions must be 1200 × 1950.');
    } else if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-')
      throw new AppError('Invalid PDF output.');
    files[name] = bytes;
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const base = `${member.id}/${id}`;
  const objectPaths = [`${base}/front.png`];
  if (side === 'both') objectPaths.push(`${base}/back.png`, `${base}/ID.pdf`);
  const keys = objectPaths.map((path) => `generated-ids/${path}`);
  try {
    const uploads = await Promise.all(
      objectPaths.map((objectPath, index) =>
        client.storage
          .from('generated-ids')
          .upload(objectPath, files[side === 'front' ? 'front' : ['front', 'back', 'pdf'][index]], {
            contentType: side === 'both' && index === 2 ? 'application/pdf' : 'image/png',
            upsert: false,
          }),
      ),
    );
    if (uploads.some((upload) => upload.error))
      throw new AppError(
        'Generated files could not be saved to private storage.',
      );
    const accent = accentColor(member, colors);
    const { data, error } = await client.rpc('record_generation', {
      generation_id: id,
      member_uuid: member.id,
      expected_revision: member.revision,
      actor: actorId,
      snapshot: member,
      template_version_map: versions,
      accent,
      photo_reference: member.photo_path,
      front_file_path: keys[0],
      back_file_path: side === 'both' ? keys[1] : null,
      pdf_file_path: side === 'both' ? keys[2] : null,
    });
    if (error)
      throw new AppError(error.message || 'Generation could not be recorded.');
    const record: Generation = {
      id,
      member_id: member.id,
      member,
      generated_at: (data as { generated_at?: string })?.generated_at ?? now,
      generated_by: actorName,
      accent,
      template_version: version,
      status: 'Generated',
      front_path: keys[0],
      back_path: side === 'both' ? keys[1] : undefined,
      pdf_path: side === 'both' ? keys[2] : undefined,
    };
    return json(record, 201);
  } catch (error) {
    await client.storage.from('generated-ids').remove(objectPaths);
    throw error;
  }
}

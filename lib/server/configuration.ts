import type { SupabaseClient } from '@supabase/supabase-js';
import { categories } from '../domain';
import type { ColorSettings } from '../domain';
import { validateLayout } from '../templates';
import type { Template } from '../templates';
import { AppError, json, getColors, logActivity } from './database';
import { pngDimensions } from './members';

function toTemplate(row: Record<string, unknown>): Template {
  const category = row.category as Template['category'];
  const side = row.side as Template['side'];
  return {
    key: `${category}-${side}`,
    category,
    side,
    image: row.image_path as string,
    layout: row.layout as Template['layout'],
    version: row.version as string,
    approved: row.approved as boolean,
  };
}

export async function getTemplates(
  client: SupabaseClient,
): Promise<Template[]> {
  const { data, error } = await client
    .from('templates')
    .select('category,side,image_path,layout,version,approved')
    .order('category')
    .order('side');
  if (error) throw new AppError('Templates could not be loaded.');
  return (data ?? []).map((row) => toTemplate(row));
}

export async function saveTemplate(
  client: SupabaseClient,
  actorId: string,
  request: Request,
) {
  const form = await request.formData();
  const category = form.get('category') as string;
  const side = form.get('side') as string;
  if (
    !categories.includes(category as (typeof categories)[number]) ||
    !['front', 'back'].includes(side)
  )
    throw new AppError('Invalid template category or side.');
  const file = form.get('image');
  if (!(file instanceof File) || file.size > 12 * 1024 * 1024)
    throw new AppError('Template must be a PNG smaller than 12 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const size = pngDimensions(bytes);
  if (size.width !== 1200 || size.height !== 1950)
    throw new AppError('Template must be exactly 1200 × 1950 pixels.');
  const layout = JSON.parse(form.get('layout') as string);
  try {
    validateLayout(layout);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Invalid template mapping.',
    );
  }
  if (
    side === 'front' &&
    (!layout.photo ||
      !['name', 'role', 'aws_sbg_id', 'email'].every((field) =>
        layout.fields.some((box: { field: string }) => box.field === field),
      ))
  )
    throw new AppError(
      'Front template requires photo, name, role, aws_sbg_id, and email regions.',
    );
  if (form.get('approved') !== 'true')
    throw new AppError(
      'Confirm the template and field mapping have been approved.',
    );
  const version = crypto.randomUUID();
  const objectPath = `${category.toLowerCase()}/${side}/${version}.png`;
  const image = `id-templates/${objectPath}`;
  const uploaded = await client.storage
    .from('id-templates')
    .upload(objectPath, bytes, { contentType: 'image/png', upsert: false });
  if (uploaded.error)
    throw new AppError(
      'The approved template could not be saved to private storage.',
    );
  const { data, error } = await client
    .from('templates')
    .upsert(
      {
        category,
        side,
        image_path: image,
        layout,
        version,
        approved: true,
        created_by: actorId,
        updated_by: actorId,
      },
      { onConflict: 'category,side' },
    )
    .select('category,side,image_path,layout,version,approved')
    .single();
  if (error) {
    await client.storage.from('id-templates').remove([objectPath]);
    throw new AppError('The approved template could not be saved.');
  }
  await logActivity(
    client,
    actorId,
    'template_changed',
    `Updated the ${category} ${side} template.`,
  );
  return json(toTemplate(data));
}

export async function saveColors(
  client: SupabaseClient,
  actorId: string,
  request: Request,
) {
  const data = (await request.json()) as ColorSettings;
  const previous = await getColors(client);
  if (data.revision !== previous.revision)
    throw new AppError('Color settings changed. Refresh before saving.', 409);
  if (
    !['default', 'team'].includes(data.mode) ||
    !Array.isArray(data.teams) ||
    data.teams.length > 100
  )
    throw new AppError('Invalid color settings.');
  const names = new Set<string>();
  for (const team of data.teams) {
    team.name = team.name.trim();
    if (
      !team.name ||
      team.name.length > 100 ||
      !/^#[a-f\d]{6}$/i.test(team.color) ||
      typeof team.enabled !== 'boolean' ||
      names.has(team.name.toLowerCase())
    )
      throw new AppError('Each team needs a unique name and a valid color.');
    names.add(team.name.toLowerCase());
  }
  const next = { mode: data.mode, teams: data.teams };
  const { data: saved, error } = await client
    .from('app_settings')
    .update({
      value: next,
      revision: previous.revision + 1,
      updated_by: actorId,
    })
    .eq('key', 'officer_team_colors')
    .eq('revision', previous.revision)
    .select('value,revision')
    .maybeSingle();
  if (error || !saved)
    throw new AppError('Color settings changed. Refresh before saving.', 409);
  await logActivity(
    client,
    actorId,
    'team_colors_changed',
    'Updated officer team-color configuration.',
  );
  return json({
    ...(saved.value as Omit<ColorSettings, 'revision'>),
    revision: saved.revision,
  });
}

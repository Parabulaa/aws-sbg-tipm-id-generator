import { categories } from '../domain';
import type { ColorSettings } from '../domain';
import { validateLayout } from '../templates';
import type { Template } from '../templates';
import { AppError, json, getColors } from './database';
import type { Bindings } from './database';
import { pngDimensions } from './members';
export async function getTemplates(env: Bindings): Promise<Template[]> {
  const rows = await env.DB.prepare(
    "SELECT data FROM settings WHERE id LIKE 'template:%'",
  ).all<{ data: string }>();
  return rows.results.map((row) => JSON.parse(row.data));
}
export async function saveTemplate(env: Bindings, request: Request) {
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
  const key = `${category}-${side}`;
  const image = `templates/${key}/${version}.png`;
  await env.FILES.put(image, bytes, {
    httpMetadata: { contentType: 'image/png' },
  });
  const template: Template = {
    key,
    category: category as Template['category'],
    side: side as Template['side'],
    image,
    layout,
    version,
    approved: true,
  };
  await env.DB.prepare(
    'INSERT INTO settings (id, data, revision) VALUES (?, ?, 1) ON CONFLICT(id) DO UPDATE SET data = excluded.data, revision = settings.revision + 1',
  )
    .bind(`template:${key}`, JSON.stringify(template))
    .run();
  return json(template);
}
export async function saveColors(env: Bindings, request: Request) {
  const data = (await request.json()) as ColorSettings;
  const previous = await getColors(env.DB);
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
  data.revision++;
  const result =
    previous.revision === 0
      ? await env.DB.prepare(
          "INSERT OR IGNORE INTO settings (id,data,revision) VALUES ('colors',?,1)",
        )
          .bind(JSON.stringify(data))
          .run()
      : await env.DB.prepare(
          "UPDATE settings SET data=?, revision=? WHERE id='colors' AND revision=?",
        )
          .bind(JSON.stringify(data), data.revision, previous.revision)
          .run();
  if (!result.meta.changes)
    throw new AppError('Color settings changed. Refresh before saving.', 409);
  return json(data);
}

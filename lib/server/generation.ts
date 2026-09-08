import { accentColor, displayName } from '../domain';
import type { Generation, MemberRecord } from '../domain';
import { AppError, getMember, getColors, checkRevision, json } from './database';
import type { Bindings } from './database';
import { getTemplates } from './configuration';
import { pngDimensions } from './members';
export async function generate(env: Bindings, request: Request, actor: string) {
  const form = await request.formData();
  const member = await getMember(env.DB, String(form.get('member_id')));
  checkRevision(member, Number(form.get('revision')));
  if (member.status !== 'Ready') throw new AppError('Only reviewed Ready members can be generated. Confirm this member first.');
  const templates = (await getTemplates(env)).filter(item => item.category === member.membership_type);
  if (!['front','back'].every(side => templates.some(item => item.side === side && item.approved))) throw new AppError('Approved front and back templates are required.');
  const version = ['front','back'].map(side => templates.find(item => item.side === side)!.version).join(':');
  const colors = await getColors(env.DB);
  if (form.get('template_version') !== version || Number(form.get('color_revision')) !== colors.revision) throw new AppError('Templates or colors changed. Refresh and regenerate.', 409);
  const files: Record<string, Uint8Array> = {};
  for (const name of ['front','back','pdf']) {
    const file = form.get(name);
    if (!(file instanceof File) || !file.size || file.size > 20 * 1024 * 1024) throw new AppError('Generated files are missing or too large.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (name !== 'pdf') {
      const size = pngDimensions(bytes);
      if (size.width !== 1200 || size.height !== 1950) throw new AppError('Export dimensions must be 1200 × 1950.');
    } else if (new TextDecoder().decode(bytes.slice(0,5)) !== '%PDF-') throw new AppError('Invalid PDF output.');
    files[name] = bytes;
  }
  const id = crypto.randomUUID(); const now = new Date().toISOString();
  const record: Generation = { id, member_id: member.id, member, generated_at: now, generated_by: actor, accent: accentColor(member, colors), template_version: version, status: 'Generated' };
  const keys = [`exports/${id}/front.png`, `exports/${id}/back.png`, `exports/${id}/ID.pdf`];
  try {
    await Promise.all(keys.map((key, index) => env.FILES.put(key, files[['front','back','pdf'][index]], { httpMetadata: { contentType: index === 2 ? 'application/pdf' : 'image/png' } })));
    const updated: MemberRecord = { ...member, status: 'Generated', updated_at: now, revision: member.revision + 1 };
    const results = await env.DB.batch([
      env.DB.prepare('INSERT INTO generated_ids (id,member_id,data,created_at) SELECT ?,?,?,? FROM members WHERE id=? AND revision=? AND status=\'Ready\'').bind(id,member.id,JSON.stringify(record),now,member.id,member.revision),
      env.DB.prepare("UPDATE members SET data=?,status='Generated',revision=? WHERE id=? AND revision=? AND EXISTS (SELECT 1 FROM generated_ids WHERE id=?)").bind(JSON.stringify(updated),updated.revision,member.id,member.revision,id),
      env.DB.prepare('INSERT INTO activities (id,member_id,message,created_at) SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM generated_ids WHERE id=?)').bind(crypto.randomUUID(),member.id,`ID generated: ${displayName(member)}`,now,id),
    ]);
    if (!results[0].meta.changes) throw new AppError('Member changed during generation. Review again.',409);
    return json(record,201);
  } catch (error) { await env.FILES.delete(keys); throw error; }
}

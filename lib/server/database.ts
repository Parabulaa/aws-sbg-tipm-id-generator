import { env } from 'cloudflare:workers';
import type { Activity, ColorSettings, MemberRecord } from '../domain';
import { AppError } from './errors';
export { AppError } from './errors';
export interface Bindings {
  DB: D1Database;
  FILES: R2Bucket;
  DEV_LOCAL_ONLY?: string;
  AUTH_USERS?: string;
  SESSION_SECRET?: string;
}
export function bindings(): Bindings {
  return env as unknown as Bindings;
}
export const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export async function getMembers(db: D1Database) {
  const rows = await db
    .prepare('SELECT data FROM members ORDER BY aws_sbg_id')
    .all<{ data: string }>();
  return rows.results.map((row) => JSON.parse(row.data) as MemberRecord);
}
export async function getMember(db: D1Database, id: string) {
  const row = await db
    .prepare('SELECT data FROM members WHERE id = ?')
    .bind(id)
    .first<{ data: string }>();
  if (!row) throw new AppError('Member not found.', 404);
  return JSON.parse(row.data) as MemberRecord;
}
export async function getColors(db: D1Database): Promise<ColorSettings> {
  const row = await db
    .prepare("SELECT data, revision FROM settings WHERE id = 'colors'")
    .first<{ data: string; revision: number }>();
  return row
    ? { ...JSON.parse(row.data), revision: row.revision }
    : { mode: 'default', teams: [], revision: 0 };
}
export function activity(db: D1Database, memberId: string, message: string) {
  return db
    .prepare(
      'INSERT INTO activities (id, member_id, message, created_at) VALUES (?, ?, ?, ?)',
    )
    .bind(crypto.randomUUID(), memberId, message, new Date().toISOString());
}
export async function getActivity(db: D1Database) {
  return (
    await db
      .prepare(
        'SELECT id, member_id, message, created_at FROM activities ORDER BY created_at DESC LIMIT 30',
      )
      .all<Activity>()
  ).results;
}
export function checkRevision(member: MemberRecord, revision: unknown) {
  if (member.revision !== revision)
    throw new AppError(
      'This member changed in another session. Refresh and review the latest information.',
      409,
    );
}
export async function saveMember(
  db: D1Database,
  previous: MemberRecord,
  updated: MemberRecord,
  message: string,
) {
  updated.revision = previous.revision + 1;
  updated.updated_at = new Date().toISOString();
  const results = await db.batch([
    db
      .prepare(
        'UPDATE members SET data = ?, status = ?, aws_sbg_id = ?, revision = ? WHERE id = ? AND revision = ?',
      )
      .bind(
        JSON.stringify(updated),
        updated.status,
        updated.aws_sbg_id,
        updated.revision,
        previous.id,
        previous.revision,
      ),
    db
      .prepare(
        'INSERT INTO activities (id, member_id, message, created_at) SELECT ?, ?, ?, ? WHERE changes() = 1',
      )
      .bind(crypto.randomUUID(), previous.id, message, updated.updated_at),
  ]);
  if (!results[0].meta.changes)
    throw new AppError(
      'This member changed in another session. Refresh before saving.',
      409,
    );
  return updated;
}

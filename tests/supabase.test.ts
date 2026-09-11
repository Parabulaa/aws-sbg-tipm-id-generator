import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const directory = join(process.cwd(), 'supabase', 'migrations');
const sql = readdirSync(directory)
  .filter((name) => name.endsWith('.sql'))
  .sort()
  .map((name) => readFileSync(join(directory, name), 'utf8'))
  .join('\n');

void test('Supabase schema enables RLS and keeps application buckets private', () => {
  for (const table of [
    'officer_profiles',
    'members',
    'generated_ids',
    'activities',
    'app_settings',
    'templates',
    'id_counters',
  ])
    assert.match(
      sql,
      new RegExp(
        `alter table public\\.${table} enable row level security`,
        'i',
      ),
    );
  for (const bucket of ['member-photos', 'id-templates', 'generated-ids'])
    assert.match(sql, new RegExp(`'${bucket}'`));
  assert.match(sql, /public\.is_admin\(\)/);
  assert.match(sql, /storage_template_admin_insert/);
});

void test('member creation allocates IDs while holding the yearly counter lock', () => {
  assert.match(sql, /function public\.create_members/i);
  assert.match(
    sql,
    /from public\.id_counters where scope = year_scope for update/i,
  );
  assert.match(sql, /lpad\(\(first_value \+ offset_value\)::text, 3, '0'\)/i);
  assert.match(sql, /AWSSBG-TIPM/i);
  assert.match(sql, /jsonb_array_length\(member_rows\)/i);
  assert.match(sql, /aws_sbg_id text unique not null/i);
});

void test('generation and archive permissions are enforced below the UI', () => {
  assert.match(sql, /function public\.record_generation/i);
  assert.match(sql, /archived members cannot generate IDs/i);
  assert.match(sql, /members_officer_update_active_only/i);
  assert.match(sql, /members_admin_update/i);
  assert.match(sql, /templates_admin_update/i);
});

void test('batch deletion is restricted to administrators and clears dependent records', () => {
  assert.match(sql, /function public\.delete_members/i);
  assert.match(sql, /not public\.is_admin\(\)/i);
  assert.match(sql, /update public\.activities set member_id = null/i);
  assert.match(sql, /delete from public\.generated_ids/i);
  assert.match(sql, /delete from public\.members/i);
});

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
const allocationSql = readFileSync(
  join(directory, '20260913000200_active_membership_slots.sql'),
  'utf8',
);
const qcSql = readFileSync(
  join(directory, '20260915000100_qc_members.sql'),
  'utf8',
);
const qcReservationSql = readFileSync(
  join(directory, '20260915000300_reserve_qc_officer_ids.sql'),
  'utf8',
);

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

void test('member creation uses the lowest free current-record slot under a transaction lock', () => {
  assert.match(allocationSql, /function public\.create_members/i);
  assert.match(allocationSql, /pg_advisory_xact_lock/i);
  assert.match(allocationSql, /generate_series\(1, 19\)/i);
  assert.match(allocationSql, /generate_series\(20, 9999\)/i);
  assert.match(allocationSql, /where not exists[\s\S]*public\.members/i);
  assert.match(allocationSql, /where archived_at is null/i);
  assert.match(allocationSql, /lpad\(next_sequence::text, 4, '0'\)/i);
  assert.match(allocationSql, /members_membership_slot_current_unique/i);
  assert.match(allocationSql, /where archived_at is null/i);
  assert.match(allocationSql, /members_aws_sbg_id_current_unique/i);
  assert.doesNotMatch(allocationSql, /id_counters|max\s*\(/i);
});

function allocateLowest(occupied: number[], count = 1) {
  const used = new Set(occupied);
  const allocated: number[] = [];
  for (let index = 0; index < count; index++) {
    let candidate = 20;
    while (used.has(candidate)) candidate++;
    used.add(candidate);
    allocated.push(candidate);
  }
  return allocated;
}

void test('member slots reserve 0001-0019 and fill the lowest gaps', () => {
  assert.deepEqual(allocateLowest([], 1), [20]);
  assert.deepEqual(
    allocateLowest([], 77),
    Array.from({ length: 77 }, (_, index) => index + 20),
  );
  assert.deepEqual(allocateLowest([20, 21, 22, 24], 1), [23]);
  assert.deepEqual(allocateLowest([20, 22, 25], 4), [21, 23, 24, 26]);
  assert.deepEqual(
    allocateLowest(
      Array.from({ length: 81 }, (_, index) => index + 20).filter(
        (value) => value !== 55,
      ),
      1,
    ),
    [55],
  );
  assert.deepEqual(
    allocateLowest([], 200),
    Array.from({ length: 200 }, (_, index) => index + 20),
  );
  assert.ok(allocateLowest([], 200).every((value) => value >= 20));
});

void test('QC members use campus-scoped three-digit TIPQ IDs and templates', () => {
  assert.match(qcSql, /AWSSBG-TIPQ-/);
  assert.match(qcSql, /lpad\(next_sequence::text, 3, '0'\)/i);
  assert.match(qcSql, /generate_series\(36, 999\)/i);
  assert.doesNotMatch(qcSql, /generate_series\(1, 999\)/i);
  assert.match(qcSql, /campus, membership_year, membership_sequence/i);
  assert.match(qcSql, /static\/qc-member\/front\.png/i);
  assert.match(qcSql, /static\/qc-member\/back\.png/i);
  assert.match(qcReservationSql, /generate_series\(36, 999\)/i);
  assert.doesNotMatch(qcReservationSql, /generate_series\(1, 999\)/i);
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

void test('structured audit logs are indexed and keep RLS enabled', () => {
  assert.match(sql, /alter table public\.activity_logs enable row level security/i);
  for (const column of ['actor_user_id', 'actor_email', 'category', 'target_type', 'description', 'metadata'])
    assert.match(sql, new RegExp(`add column if not exists ${column}`, 'i'));
  assert.match(sql, /activity_logs_category_created_at_idx/i);
  assert.match(sql, /activity_logs_action_created_at_idx/i);
  assert.match(sql, /Credentials, tokens, passwords, and secret keys are prohibited/i);
});

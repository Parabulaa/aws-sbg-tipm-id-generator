import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  blankMember,
  displayName,
  normalizeMember,
  normalizeYearLevel,
  validateMember,
  reviewStatus,
  safeFilename,
  contrastText,
  formatAwsSbgId,
  officerPositions,
  teamForOfficerPosition,
  isArchived,
} from '../lib/domain';

const input = {
  ...blankMember,
  full_name: 'Test de la Test',
  tip_email: 'test@example.org',
  student_id_number: '001234',
  program: 'BSCS',
  year_level: '2nd Year',
};

void test('full names remain canonical and student IDs preserve leading zeroes', () => {
  assert.equal(displayName(input), 'Test de la Test');
  assert.equal(normalizeMember(input).student_id_number, '001234');
  assert.equal(normalizeYearLevel('2'), '2nd Year');
  assert.equal(normalizeYearLevel('3rd year'), '3rd Year');
});

void test('member validation covers required data and officer fields', () => {
  assert.deepEqual(validateMember(input), []);
  for (const changed of [
    { tip_email: 'broken' },
    { student_id_number: '' },
    { program: '' },
    { membership_type: 'Officer' },
  ]) {
    assert.ok(validateMember(normalizeMember({ ...input, ...changed })).length);
  }
});

void test('officer positions use the canonical controlled list', () => {
  assert.ok(officerPositions.includes('AI/ML LEAD'));
  assert.ok(
    validateMember({
      ...input,
      membership_type: 'Officer',
      officer_position: 'UNLISTED ROLE',
      team: 'Technology',
    }).includes('Select a valid officer position'),
  );
});

void test('edits invalidate readiness and uploading never confirms', () => {
  assert.equal(reviewStatus(input, null), 'Needs Photo');
  assert.equal(reviewStatus(input, 'photo'), 'Draft');
  assert.equal(
    reviewStatus({ ...input, tip_email: '' }, 'photo'),
    'Needs Attention',
  );
});

void test('filenames and contrast are deterministic', () => {
  assert.equal(
    safeFilename({ ...input, aws_sbg_id: 'AWSSBG-TIPM-26001' }),
    'AWSSBG-TIPM-26001_Test-de-la-Test',
  );
  assert.equal(contrastText('#000000'), '#ffffff');
  assert.equal(contrastText('#ffffff'), '#000000');
});

void test('AWS SBG IDs use the configured prefix and never collapse sequence values', () => {
  assert.equal(
    formatAwsSbgId('AWSSBG-TIPM', 2026, 1),
    'AWSSBG-TIPM-26001',
  );
  assert.equal(
    formatAwsSbgId('AWSSBG-TIPM', 2026, 10000),
    'AWSSBG-TIPM-2610000',
  );
  assert.notEqual(
    formatAwsSbgId('AWSSBG-TIPM', 2026, 10),
    formatAwsSbgId('AWSSBG-TIPM', 2026, 11),
  );
});

void test('technology leads and CTO roles derive the Technology office', () => {
  for (const position of [
    'CHIEF TECHNOLOGY OFFICER',
    'VICE-CHIEF TECHNOLOGY OFFICER',
    'AI/ML LEAD',
    'SOFTWARE ENGINEERING LEAD',
  ])
    assert.equal(teamForOfficerPosition(position), 'Technology / CTO Office');
});

void test('archive state is explicit and reversible', () => {
  assert.equal(isArchived({ archived_at: null }), false);
  assert.equal(isArchived({ archived_at: '2026-09-09T00:00:00Z' }), true);
});

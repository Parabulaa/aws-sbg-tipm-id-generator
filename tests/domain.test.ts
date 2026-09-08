import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  blankMember,
  displayName,
  normalizeMember,
  validateMember,
  reviewStatus,
  safeFilename,
  contrastText,
} from '../lib/domain';
const input = {
  ...blankMember,
  first_name: 'Test',
  middle_name: 'Long',
  last_name: 'de la Test',
  email: 'test@example.org',
  aws_sbg_id: 'TEST-001',
  date_issued: '2026-09-08',
  valid_until: '2027-09-08',
};
void test('name formatting preserves surnames, optional middle initial and original values', () => {
  assert.equal(displayName(input), 'Test L. de la Test');
  assert.equal(displayName({ ...input, middle_name: '' }), 'Test de la Test');
  assert.equal(input.middle_name, 'Long');
});
void test('validates dates, officers, membership and email', () => {
  assert.deepEqual(validateMember(input), []);
  for (const changed of [
    { email: 'broken' },
    { date_issued: '2026-02-30' },
    { valid_until: '2025-01-01' },
    { membership_type: 'Officer' },
  ]) {
    assert.ok(validateMember(normalizeMember({ ...input, ...changed })).length);
  }
});
void test('edits invalidate readiness and uploading never confirms', () => {
  assert.deepEqual(
    validateMember({ ...input, photo_url: null, revision: 1 } as typeof input),
    [],
  );
  assert.equal(reviewStatus(input, null), 'Needs Photo');
  assert.equal(reviewStatus(input, 'photo'), 'Draft');
  assert.equal(
    reviewStatus({ ...input, email: '' }, 'photo'),
    'Needs Attention',
  );
});
void test('filenames and contrast are deterministic', () => {
  assert.equal(safeFilename(input), 'TEST-001_Test-L-de-la-Test');
  assert.equal(contrastText('#000000'), '#ffffff');
  assert.equal(contrastText('#ffffff'), '#000000');
});

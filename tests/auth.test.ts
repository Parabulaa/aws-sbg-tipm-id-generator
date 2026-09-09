import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sameOrigin } from '../lib/server/auth';
import { assertOfficerRole, bearerToken } from '../lib/server/supabase';
import type { OfficerProfile } from '../lib/server/supabase';

const profile: OfficerProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'officer@example.org',
  display_name: 'Officer Test',
  role: 'officer',
  is_active: true,
};

void test('bearer authentication input and same-origin writes fail closed', () => {
  assert.equal(
    bearerToken(
      new Request('https://example.org/api/members', {
        headers: { Authorization: 'Bearer signed-access-token' },
      }),
    ),
    'signed-access-token',
  );
  assert.equal(bearerToken(new Request('https://example.org/api/members')), '');
  assert.throws(
    () =>
      sameOrigin(
        new Request('https://example.org/api/members', {
          method: 'POST',
          headers: { Origin: 'https://elsewhere.example' },
        }),
      ),
    /application/,
  );
});

void test('active officer and administrator authorization is explicit', () => {
  assert.doesNotThrow(() => assertOfficerRole(profile));
  assert.throws(() => assertOfficerRole(profile, 'admin'), /Administrator/);
  assert.doesNotThrow(() =>
    assertOfficerRole({ ...profile, role: 'admin' }, 'admin'),
  );
  assert.throws(
    () => assertOfficerRole({ ...profile, is_active: false }),
    /not active/,
  );
});

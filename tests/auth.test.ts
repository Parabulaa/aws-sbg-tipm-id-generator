import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sameOrigin } from '../lib/server/auth';
import { assertOfficerRole, bearerToken } from '../lib/server/supabase';
import type { OfficerProfile } from '../lib/server/supabase';
import { validateNewPassword } from '../lib/password';

const profile: OfficerProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'officer@example.org',
  display_name: 'Officer Test',
  role: 'officer',
  is_active: true,
  must_change_password: false,
  password_changed_at: null,
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

void test('voluntary and forced password forms share strict validation', () => {
  assert.match(validateNewPassword('short', 'short'), /at least 8/);
  assert.match(validateNewPassword('long-enough', 'different'), /do not match/);
  assert.equal(validateNewPassword('long-enough', 'long-enough'), '');
});

void test('dashboard startup authenticates through one bootstrap request', () => {
  const provider = readFileSync(
    join(process.cwd(), 'components', 'data-provider.tsx'),
    'utf8',
  );
  assert.match(provider, /'bootstrap'/);
  assert.doesNotMatch(provider, /Promise\.allSettled\(\[/);
  assert.match(provider, /bootstrap\.members.*previous\.members/);
});

void test('forced password completion requires a fresh login', () => {
  const page = readFileSync(
    join(process.cwd(), 'app', 'change-password', 'page.tsx'),
    'utf8',
  );
  assert.match(page, /signOut\(\{ scope: 'local' \}\)/);
  assert.match(page, /location\.replace\('\/login'\)/);
  assert.doesNotMatch(page, /location\.assign\('\/dashboard'\)/);
});

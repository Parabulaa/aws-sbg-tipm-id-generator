import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pbkdf2Sync } from 'node:crypto';
import { authorize, login, sameOrigin } from '../lib/server/auth';
import type { Bindings } from '../lib/server/database';
void test('online access fails closed and local bypass is explicitly scoped', async () => {
  await assert.rejects(
    () =>
      authorize(new Request('https://example.org/api/members'), {} as Bindings),
    /configured/,
  );
  assert.equal(
    await authorize(new Request('http://localhost/api/members'), {
      DEV_LOCAL_ONLY: 'true',
    } as Bindings),
    'Local officer',
  );
  await assert.rejects(
    () =>
      authorize(new Request('https://example.org/api/members'), {
        DEV_LOCAL_ONLY: 'true',
      } as Bindings),
    /configured/,
  );
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
void test('allowlisted officer login, signed session, tamper and invalid password', async () => {
  const env = {
    SESSION_SECRET: 'test-only-32-character-secret-value',
    AUTH_USERS: JSON.stringify({
      'officer@example.org': {
        salt: 'test-salt',
        hash: Array.from(
          pbkdf2Sync('test-password', 'test-salt', 100000, 32, 'sha256'),
        )
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join(''),
      },
    }),
  } as Bindings;
  const request = (password: string) =>
    new Request('https://example.org/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'officer@example.org', password }),
    });
  await assert.rejects(() => login(request('incorrect'), env), /incorrect/);
  const response = await login(request('test-password'), env);
  const cookie = response.headers.get('Set-Cookie')!;
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.equal(
    await authorize(
      new Request('https://example.org/api/members', {
        headers: { Cookie: cookie.split(';')[0] },
      }),
      env,
    ),
    'officer@example.org',
  );
  await assert.rejects(
    () =>
      authorize(
        new Request('https://example.org/api/members', {
          headers: { Cookie: cookie.split(';')[0] + 'tampered' },
        }),
        env,
      ),
    /expired/,
  );
});

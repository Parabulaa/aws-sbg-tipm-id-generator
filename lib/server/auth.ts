import { AppError } from './database';
import type { Bindings } from './database';
const cookieName = 'sbg_session';
const encoder = new TextEncoder();
async function signature(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)))).map(byte => byte.toString(16).padStart(2, '0')).join('');
}
function equal(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
export function localAccess(request: Request, env: Bindings) {
  return env.DEV_LOCAL_ONLY === 'true' && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(request.url).hostname);
}
export function sameOrigin(request: Request) {
  if (['GET', 'HEAD'].includes(request.method)) return;
  if (request.headers.get('Origin') !== new URL(request.url).origin) throw new AppError('This request must come from the application.', 403);
}
export async function authorize(request: Request, env: Bindings): Promise<string> {
  if (localAccess(request, env)) return 'Local officer';
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32 || !env.AUTH_USERS) throw new AppError('Officer access must be configured before this installation can be used online.', 503);
  const token = request.headers.get('Cookie')?.split('; ').find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  if (!token) throw new AppError('Sign in to access member records.', 401);
  const [payload, signed] = token.split('.');
  if (!payload || !signed || !equal(await signature(payload, env.SESSION_SECRET), signed)) throw new AppError('Session expired. Please sign in.', 401);
  try {
    const session = JSON.parse(atob(payload)) as { email: string; expires: number };
    if (session.expires < Date.now() || !JSON.parse(env.AUTH_USERS)[session.email]) throw new Error('Expired');
    return session.email;
  } catch { throw new AppError('Session expired. Please sign in.', 401); }
}
export async function login(request: Request, env: Bindings) {
  if (localAccess(request, env)) return Response.json({ user: 'Local officer' });
  if (!env.AUTH_USERS || !env.SESSION_SECRET || env.SESSION_SECRET.length < 32) throw new AppError('Officer sign-in has not been configured.', 503);
  const { email, password } = await request.json() as { email: string; password: string };
  if (typeof email !== 'string' || typeof password !== 'string' || password.length > 256) throw new AppError('Invalid sign-in details.', 401);
  const users = JSON.parse(env.AUTH_USERS) as Record<string, { salt: string; hash: string }>;
  const entry = users[email.toLowerCase()] ?? { salt: 'unregistered', hash: '' };
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(entry.salt), iterations: 100000 }, key, 256);
  const hash = Array.from(new Uint8Array(bits)).map(byte => byte.toString(16).padStart(2, '0')).join('');
  if (!equal(hash, entry.hash)) throw new AppError('Email or password is incorrect.', 401);
  const payload = btoa(JSON.stringify({ email: email.toLowerCase(), expires: Date.now() + 8 * 60 * 60 * 1000 }));
  const token = `${payload}.${await signature(payload, env.SESSION_SECRET)}`;
  return Response.json({ user: email.toLowerCase() }, { headers: { 'Set-Cookie': `${cookieName}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`, 'Cache-Control': 'no-store' } });
}

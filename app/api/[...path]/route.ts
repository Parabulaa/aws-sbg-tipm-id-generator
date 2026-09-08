import {
  bindings,
  AppError,
  json,
  getMembers,
  getColors,
  getActivity,
} from '@/lib/server/database';
import { authorize, login, sameOrigin } from '@/lib/server/auth';
import {
  importMembers,
  updateMember,
  confirmMember,
  photo,
} from '@/lib/server/members';
import {
  getTemplates,
  saveTemplate,
  saveColors,
} from '@/lib/server/configuration';
import { generate } from '@/lib/server/generation';
async function handle(request: Request) {
  try {
    sameOrigin(request);
    if (Number(request.headers.get('Content-Length')) > 65 * 1024 * 1024)
      throw new AppError('Request too large.', 413);
    const env = bindings();
    const path = new URL(request.url).pathname
      .replace(/^\/api\//, '')
      .split('/');
    if (path[0] === 'login' && request.method === 'POST')
      return await login(request, env);
    const actor = await authorize(request, env);
    if (path[0] === 'session') return json({ user: actor });
    if (path[0] === 'logout' && request.method === 'POST')
      return new Response(null, {
        headers: {
          'Set-Cookie':
            'sbg_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
        },
      });
    if (path[0] === 'members') {
      if (request.method === 'GET' && !path[1])
        return json(await getMembers(env.DB));
      if (request.method === 'POST' && (!path[1] || path[1] === 'import')) {
        const data = (await request.json()) as { members: unknown };
        return await importMembers(env, data.members, !path[1]);
      }
      if (path[2] === 'photo' && ['POST', 'DELETE'].includes(request.method))
        return await photo(env, path[1], request);
      if (path[2] === 'confirm' && request.method === 'POST')
        return await confirmMember(env, path[1], request);
      if (request.method === 'PUT' && path[1] && !path[2])
        return await updateMember(env, path[1], request);
    }
    if (path[0] === 'colors')
      return request.method === 'GET'
        ? json(await getColors(env.DB))
        : request.method === 'PUT'
          ? await saveColors(env, request)
          : json({ error: 'Method not allowed' }, 405);
    if (path[0] === 'templates')
      return request.method === 'GET'
        ? json(await getTemplates(env))
        : request.method === 'POST'
          ? await saveTemplate(env, request)
          : json({ error: 'Method not allowed' }, 405);
    if (path[0] === 'activity' && request.method === 'GET')
      return json(await getActivity(env.DB));
    if (path[0] === 'generations') {
      if (request.method === 'POST') return await generate(env, request, actor);
      if (request.method === 'GET') {
        const rows = await env.DB.prepare(
          'SELECT data FROM generated_ids ORDER BY created_at DESC',
        ).all<{ data: string }>();
        return json(rows.results.map((row) => JSON.parse(row.data)));
      }
    }
    if (path[0] === 'files' && request.method === 'GET') {
      const key = decodeURIComponent(path.slice(1).join('/'));
      if (
        !/^(photos|templates|exports)\/[a-zA-Z0-9_./-]+$/.test(key) ||
        key.includes('..')
      )
        throw new AppError('Invalid file path.');
      const file = await env.FILES.get(key);
      if (!file) throw new AppError('File not found.', 404);
      const headers = new Headers({
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      file.writeHttpMetadata(headers);
      return new Response(file.body, { headers });
    }
    return json({ error: 'Not found.' }, 404);
  } catch (error) {
    if (error instanceof AppError)
      return json({ error: error.message }, error.status);
    if (error instanceof SyntaxError)
      return json(
        { error: 'The uploaded configuration or request is invalid.' },
        400,
      );
    const message = error instanceof Error ? error.message : '';
    if (message.includes('UNIQUE'))
      return json(
        {
          error: 'An AWS SBG ID already exists. Refresh and check duplicates.',
        },
        409,
      );
    console.error('ID application request failed', error);
    return json(
      {
        error:
          'The operation could not be saved. Check database setup and try again.',
      },
      500,
    );
  }
}
export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;

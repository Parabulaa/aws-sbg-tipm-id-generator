import {
  bindings,
  AppError,
  json,
  getMembers,
  getColors,
  getActivity,
} from '@/lib/server/database';
import { sameOrigin } from '@/lib/server/auth';
import { assertOfficerRole, requireOfficer } from '@/lib/server/supabase';
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
    const auth = await requireOfficer(request, env);
    const actor = auth.actor;
    if (path[0] === 'session')
      return json({
        user: actor,
        email: auth.profile.email,
        role: auth.profile.role,
        id: auth.profile.id,
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
          ? (assertOfficerRole(auth.profile, 'admin'),
            await saveColors(env, request))
          : json({ error: 'Method not allowed' }, 405);
    if (path[0] === 'templates')
      return request.method === 'GET'
        ? json(await getTemplates(env))
        : request.method === 'POST'
          ? (assertOfficerRole(auth.profile, 'admin'),
            await saveTemplate(env, request))
          : json({ error: 'Method not allowed' }, 405);
    if (path[0] === 'officers') {
      assertOfficerRole(auth.profile, 'admin');
      if (request.method === 'GET') {
        const { data, error } = await auth.client
          .from('officer_profiles')
          .select('id,email,display_name,role,is_active')
          .order('email');
        if (error) throw new AppError('Officer access could not be loaded.');
        return json(data);
      }
      if (request.method === 'PUT' && path[1]) {
        const body = (await request.json()) as {
          display_name?: unknown;
          role?: unknown;
          is_active?: unknown;
        };
        if (
          typeof body.display_name !== 'string' ||
          body.display_name.trim().length > 120 ||
          !['admin', 'officer'].includes(String(body.role)) ||
          typeof body.is_active !== 'boolean'
        )
          throw new AppError('Invalid officer access settings.');
        if (path[1] === auth.profile.id && !body.is_active)
          throw new AppError('You cannot deactivate your own account.');
        const { data, error } = await auth.client
          .from('officer_profiles')
          .update({
            display_name: body.display_name.trim(),
            role: body.role,
            is_active: body.is_active,
          })
          .eq('id', path[1])
          .select('id,email,display_name,role,is_active')
          .single();
        if (error) throw new AppError('Officer access could not be updated.');
        return json(data);
      }
    }
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

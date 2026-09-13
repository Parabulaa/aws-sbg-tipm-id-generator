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
  archiveMember,
  restoreMember,
  deleteMembers,
} from '@/lib/server/members';
import {
  getTemplates,
  saveTemplate,
  saveColors,
} from '@/lib/server/configuration';
import { generate, getGenerations } from '@/lib/server/generation';
import {
  changeOwnPassword,
  createOfficerAccount,
  listAdminActivity,
  listOfficers,
  logAdminActivity,
  updateOfficerAccount,
} from '@/lib/server/admin';
async function handle(request: Request) {
  try {
    sameOrigin(request);
    if (Number(request.headers.get('Content-Length')) > 65 * 1024 * 1024)
      throw new AppError('Request too large.', 413);
    const env = await bindings();
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
        must_change_password: auth.profile.must_change_password,
      });
    if (path[0] === 'account' && path[1] === 'password' && request.method === 'PUT')
      return json(await changeOwnPassword(auth.client, env, auth.profile, request));
    if (auth.profile.must_change_password)
      throw new AppError('Change your temporary password before continuing.', 428);
    if (path[0] === 'members') {
      if (request.method === 'DELETE' && !path[1]) {
        assertOfficerRole(auth.profile, 'admin');
        return await deleteMembers(auth.client, auth.profile.id, request);
      }
      if (request.method === 'GET' && !path[1]) {
        const includeArchived =
          new URL(request.url).searchParams.get('archived') === 'true';
        if (includeArchived) assertOfficerRole(auth.profile, 'admin');
        return json(await getMembers(auth.client, includeArchived));
      }
      if (request.method === 'POST' && (!path[1] || path[1] === 'import')) {
        const data = (await request.json()) as { members: unknown };
        const response = await importMembers(
          auth.client,
          auth.profile.id,
          data.members,
          !path[1],
        );
        await logAdminActivity(auth.client, auth.profile, 'Imported members');
        return response;
      }
      if (path[2] === 'photo' && ['POST', 'DELETE'].includes(request.method))
        return await photo(auth.client, auth.profile.id, path[1], request);
      if (path[2] === 'confirm' && request.method === 'POST')
        return await confirmMember(
          auth.client,
          auth.profile.id,
          path[1],
          request,
        );
      if (path[2] === 'archive' && request.method === 'POST')
        return await archiveMember(
          auth.client,
          auth.profile.id,
          path[1],
          request,
        );
      if (path[2] === 'restore' && request.method === 'POST') {
        assertOfficerRole(auth.profile, 'admin');
        return await restoreMember(
          auth.client,
          auth.profile.id,
          path[1],
          request,
        );
      }
      if (request.method === 'PUT' && path[1] && !path[2])
        return await updateMember(
          auth.client,
          auth.profile.id,
          path[1],
          request,
        );
    }
    if (path[0] === 'colors')
      return request.method === 'GET'
        ? json(await getColors(auth.client))
        : request.method === 'PUT'
          ? (assertOfficerRole(auth.profile, 'admin'),
            await saveColors(auth.client, auth.profile.id, request))
          : json({ error: 'Method not allowed' }, 405);
    if (path[0] === 'templates')
      return request.method === 'GET'
        ? json(await getTemplates(auth.client))
        : request.method === 'POST'
          ? (assertOfficerRole(auth.profile, 'admin'),
            await saveTemplate(auth.client, auth.profile.id, request))
          : json({ error: 'Method not allowed' }, 405);
    if (path[0] === 'officers') {
      assertOfficerRole(auth.profile, 'admin');
      if (request.method === 'GET') return json(await listOfficers(auth.client));
      if (request.method === 'POST')
        return json(await createOfficerAccount(auth.client, env, auth.profile, request));
      if (request.method === 'PUT' && path[1])
        return json(await updateOfficerAccount(auth.client, env, auth.profile, path[1], request));
    }
    if (path[0] === 'activity-logs') {
      assertOfficerRole(auth.profile, 'admin');
      if (request.method === 'GET') return json(await listAdminActivity(auth.client));
    }
    if (path[0] === 'activity' && request.method === 'GET')
      return json(await getActivity(auth.client));
    if (path[0] === 'generations') {
      if (request.method === 'POST') {
        const response = await generate(auth.client, auth.profile.id, actor, request);
        await logAdminActivity(auth.client, auth.profile, 'Generated ID');
        return response;
      }
      if (request.method === 'GET')
        return json(await getGenerations(auth.client));
    }
    if (path[0] === 'files' && request.method === 'GET') {
      const key = decodeURIComponent(path.slice(1).join('/'));
      const [bucket, ...segments] = key.split('/');
      const objectPath = segments.join('/');
      if (
        !['member-photos', 'id-templates', 'generated-ids'].includes(bucket) ||
        !/^[a-zA-Z0-9_./+-]+$/.test(objectPath) ||
        objectPath.includes('..')
      )
        throw new AppError('Invalid file path.');
      const { data, error } = await auth.client.storage
        .from(bucket)
        .download(objectPath);
      if (error || !data) throw new AppError('File not found.', 404);
      return new Response(data, {
        headers: {
          'Cache-Control': 'private, no-store',
          'Content-Type': data.type || 'application/octet-stream',
          'X-Content-Type-Options': 'nosniff',
        },
      });
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

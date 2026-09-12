export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const { getAccessToken } = await import('./supabase/client');
  const token = await getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  let response: Response;
  try {
    response = await fetch(`/api/${path}`, {
      ...options,
      headers,
      signal: options.signal ?? controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw new ApiError(
        'The connection timed out. Check your Supabase project and try again.',
        504,
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new ApiError(
      body.error || 'The request failed. Please try again.',
      response.status,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export function fileUrl(key: string) {
  return `/api/files/${key.split('/').map(encodeURIComponent).join('/')}`;
}

const privateBlobCache = new Map<string, Promise<Blob>>();

export function fetchPrivateBlob(key: string) {
  const cached = privateBlobCache.get(key);
  if (cached) return cached;
  const pending = fetchPrivateFile(key)
    .then((response) => response.blob())
    .catch((error) => {
      privateBlobCache.delete(key);
      throw error;
    });
  privateBlobCache.set(key, pending);
  return pending;
}

export function invalidatePrivateBlob(key: string) {
  privateBlobCache.delete(key);
}

// Storage stays private. Image elements and downloads need the same bearer
// session as JSON requests; a plain URL does not carry that session.
export async function fetchPrivateFile(key: string, signal?: AbortSignal) {
  const { getAccessToken } = await import('./supabase/client');
  const token = await getAccessToken();
  if (!token) throw new ApiError('Sign in again to view or download this file.', 401);
  const response = await fetch(fileUrl(key), {
    headers: { Authorization: `Bearer ${token}` },
    signal: signal ?? AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new ApiError(body.error || 'The saved file could not be loaded.', response.status);
  }
  return response;
}
export function errorText(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

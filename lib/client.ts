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
export function errorText(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

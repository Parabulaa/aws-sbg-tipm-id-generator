export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(`/api/${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as {error?:string};
    throw new ApiError(body.error || 'The request failed. Please try again.', response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
export function fileUrl(key: string) { return `/api/files/${key.split('/').map(encodeURIComponent).join('/')}`; }
export function errorText(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong. Please try again.'; }

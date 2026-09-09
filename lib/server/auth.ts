import { AppError } from './errors';

export function sameOrigin(request: Request) {
  if (['GET', 'HEAD'].includes(request.method)) return;
  if (request.headers.get('Origin') !== new URL(request.url).origin)
    throw new AppError('This request must come from the application.', 403);
}

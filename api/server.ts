// Vercel's bundler will include the compiled server worker
import worker from '../dist/server/index.js';

export default async function handler(request: Request) {
  // TanStack Start fetch handler
  return await worker.fetch(request, {}, {});
}

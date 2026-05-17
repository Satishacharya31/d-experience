export const runtime = 'edge';

// Import the built worker entry produced by the Vite build.
// The build outputs `dist/server/index.js` which re-exports the workerEntry.
import worker from '../dist/server/index.js';

export default async function handler(request: Request) {
  // The worker exposes a `fetch` method compatible with the Web Fetch API.
  // Forward the incoming Request directly to the worker and return its Response.
  return await worker.fetch(request, undefined, undefined);
}

export const config = {
  runtime: 'edge', // Using Edge runtime as the bundle is Edge-compatible (from Cloudflare)
};

// Vercel's bundler will include the compiled edge SSR worker
import worker from '../dist/server/index.js';

export default async function handler(request: Request) {
  // TanStack Start fetch handler
  return await worker.fetch(request, {}, {});
}

import { existsSync } from 'fs';
import { rm, cp, mkdir, writeFile } from 'fs/promises';
import { execSync } from 'child_process';
import { join } from 'path';

async function buildVercel() {
  console.log('--- Step 1: Building Vite app ---');
  execSync('vite build', { stdio: 'inherit' });

  // Vercel Output API dir
  const outDir = '.vercel/output';
  if (existsSync(outDir)) {
    await rm(outDir, { recursive: true, force: true });
  }

  // 1. Config Routing (Serve static first, then fallback to index function)
  console.log('--- Step 2: Configuring Vercel Static Fallback ---');
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'config.json'), JSON.stringify({
    version: 3,
    routes: [
      { handle: "filesystem" },
      { src: "/.*", dest: "/index" }
    ]
  }, null, 2));

  // 2. Static files
  console.log('--- Step 3: Copying Static Assets ---');
  await cp('dist/client', join(outDir, 'static'), { recursive: true });

  // 3. Construct Standard Node.js Serverless Function (no Edge API limit)
  console.log('--- Step 4: Building Node.js SSR Gateway ---');
  const funcDir = join(outDir, 'functions/index.func');
  await mkdir(funcDir, { recursive: true });

  await writeFile(join(funcDir, '.vc-config.json'), JSON.stringify({
    runtime: "nodejs20.x",
    handler: "entry.mjs",
    launcherType: "Nodejs"
  }, null, 2));

  // Bring the built server bundle into the function directory
  await cp('dist/server', join(funcDir, 'server'), { recursive: true });

  // Entry.mjs - bridges standard Vercel Node req/res directly to Web Request/Response without stream restrictions
  const entryCode = `
import worker from './server/index.js';
import { Readable } from 'node:stream';

export default async function (req, res) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const url = new URL(req.url || '/', \`\${protocol}://\${req.headers['x-forwarded-host'] || req.headers.host || 'localhost'}\`);
    
    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = Readable.toWeb(req);
    }

    const fetchReq = new Request(url.href, {
      method: req.method,
      headers: req.headers,
      body,
      duplex: body ? 'half' : undefined
    });

    const fetchRes = await worker.default.fetch(fetchReq, process.env || {}, {
      waitUntil: () => {},
      passThroughOnException: () => {}
    });

    res.statusCode = fetchRes.status;
    fetchRes.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });

    if (fetchRes.body) {
      const reader = fetchRes.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      res.end();
    }
  } catch (e) {
    console.error('SSR render error:', e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Internal Server Error: ' + e.message);
  }
};
`;
  await writeFile(join(funcDir, 'entry.mjs'), entryCode);

  console.log('--- Done: Vercel Output API created successfully ---');
}

buildVercel().catch(err => {
  console.error(err);
  process.exit(1);
});

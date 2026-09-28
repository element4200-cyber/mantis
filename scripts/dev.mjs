import http from 'node:http';
import path from 'node:path';
import { localDb } from './local-db.mjs';
import worker from '../worker/index.js';
const port = Number(process.env.PORT || 4173);
const env = { ...process.env, DB: localDb(path.resolve(import.meta.dirname, '../.sites-runtime/local.sqlite')) };
http.createServer(async (req, res) => {
  try {
    const headers = new Headers(req.headers);
    // Local callers cannot supply trusted platform identity headers.
    for (const name of [...headers.keys()]) if (name.startsWith('oai-authenticated-')) headers.delete(name);
    if (process.env.BUGGPAD_DEV_OWNER === '1') {
      env.BUGGPAD_OWNER_EMAIL = 'owner@example.test';
      headers.set('oai-authenticated-user-id', 'local-owner');
      headers.set('oai-authenticated-user-email', 'owner@example.test');
    }
    let body;
    if (!['GET', 'HEAD'].includes(req.method)) {
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 2048) { res.writeHead(413); res.end('Request too large'); return; } chunks.push(chunk); }
      body = Buffer.concat(chunks);
    }
    const response = await worker.fetch(new Request('http://127.0.0.1:' + port + req.url, { method: req.method, headers, ...(body ? { body } : {}) }), env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(await response.text());
  } catch (error) { console.error(error.message); res.writeHead(500); res.end('Preview request failed'); }
}).listen(port, '127.0.0.1', () => console.log('BuggPad preview: http://127.0.0.1:' + port));

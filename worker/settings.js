// Authentication headers are supplied and sanitized by the Sites dispatcher.
// Never trust browser-submitted identities or allow the first visitor to claim ownership.
export function getOwnerIdentity(request, env) {
  const id = request.headers.get('oai-authenticated-user-id');
  const email = request.headers.get('oai-authenticated-user-email');
  const ownerEmail = env.BUGGPAD_OWNER_EMAIL;
  return id && email && ownerEmail && email.toLowerCase() === ownerEmail.toLowerCase() ? id : null;
}

export function normalizeMint(input) {
  if (typeof input !== 'string') return null;
  let text = input.trim();
  if (/^https?:\/\//.test(text)) {
    try {
      const url = new URL(text);
      if (!['pump.fun', 'www.pump.fun'].includes(url.hostname)) return null;
      text = url.pathname.split('/').filter(Boolean).at(-1) || '';
    } catch { return null; }
  }
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(text)) return null;
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let n = 0n;
  for (const char of text) n = n * 58n + BigInt(alphabet.indexOf(char));
  let length = 0;
  for (; n > 0n; n >>= 8n) length++;
  for (const char of text) { if (char !== '1') break; length++; }
  return length === 32 ? text : null;
}

const settingsJson = (value, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Cookie' },
});

export async function readTokenSettings(env) {
  if (!env.DB) throw new Error('Token settings are temporarily unavailable.');
  return await env.DB.prepare('SELECT mint, owner_user_id, revision FROM token_settings WHERE id = 1').first();
}

export async function canEditToken(request, env, settings) {
  const id = getOwnerIdentity(request, env);
  return !!id && (!settings?.owner_user_id || settings.owner_user_id === id);
}

export async function handleTokenSettings(request, env) {
  try {
    if (!['GET', 'POST'].includes(request.method)) return settingsJson({ error: 'Method not allowed.' }, 405);
    // Reject writes before parsing the body or accessing storage.
    if (request.method === 'POST' && !getOwnerIdentity(request, env)) return settingsJson({ error: 'Only the site owner can change the token.' }, 403);
    if (request.method === 'POST' && (request.headers.get('Origin') !== new URL(request.url).origin || !request.headers.get('Content-Type')?.startsWith('application/json'))) return settingsJson({ error: 'Invalid save request.' }, 403);
    const settings = await readTokenSettings(env);
    const canEdit = await canEditToken(request, env, settings);
    if (request.method === 'GET') return settingsJson({ mint: settings?.mint || null, revision: settings?.revision || 0, canEdit });
    if (!canEdit) return settingsJson({ error: 'Only the site owner can change the token.' }, 403);
    const text = await request.text();
    if (text.length > 2048) return settingsJson({ error: 'Save request is too large.' }, 413);
    let body; try { body = JSON.parse(text); } catch { return settingsJson({ error: 'Invalid save request.' }, 400); }
    const mint = body.mint === null ? null : normalizeMint(body.mint);
    if (body.mint !== null && !mint) return settingsJson({ error: 'Enter a valid Solana CA or Pump.fun token URL.' }, 400);
    if (!Number.isSafeInteger(body.revision) || body.revision !== (settings?.revision || 0)) return settingsJson({ error: 'Settings changed in another tab. Reload before saving.' }, 409);
    const id = getOwnerIdentity(request, env);
    const saved = await env.DB.prepare(`INSERT INTO token_settings (id, mint, owner_user_id, revision, updated_at)
      VALUES (1, ?, ?, 1, ?)
      ON CONFLICT(id) DO UPDATE SET mint = excluded.mint, revision = token_settings.revision + 1, updated_at = excluded.updated_at
      WHERE token_settings.owner_user_id = excluded.owner_user_id AND token_settings.revision = ?
      RETURNING mint, revision`).bind(mint, id, Date.now(), body.revision).first();
    if (!saved) return settingsJson({ error: 'Settings changed in another tab. Reload before saving.' }, 409);
    return settingsJson({ mint: saved.mint, revision: saved.revision, canEdit: true });
  } catch (error) {
    console.error('Token settings unavailable:', error.message);
    return settingsJson({ error: 'Token settings are temporarily unavailable. Your changes were not saved.' }, 503);
  }
}

export async function authorizeAdminPage(request, env) {
  if (!request.headers.get('oai-authenticated-user-id')) return new Response(null, { status: 302, headers: { Location: '/signin-with-chatgpt?return_to=%2Fadmin', 'Cache-Control': 'no-store' } });
  try {
    if (await canEditToken(request, env, await readTokenSettings(env))) return null;
    return new Response('Only the BuggPad owner can change the token. Return to the battlefield at /.', { status: 403, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch { return new Response('Token settings are temporarily unavailable. Please try again.', { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}

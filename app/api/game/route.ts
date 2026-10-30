import { env } from 'cloudflare:workers';
import { act, newPlayer, newRoom, publicView, tick, type Room } from '../../../lib/game';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };
function json(body: unknown, status = 200) { return Response.json(body, { status, headers }); }
function database() { if (!env.DB) throw new Error('The garden database is unavailable. Please try again.'); return env.DB.withSession('first-primary'); }
function codeOf(v: unknown) { const code = String(v || '').toUpperCase().trim(); if (!/^[A-Z2-9]{6}$/.test(code)) throw new Error('Enter the six-character room code.'); return code; }
function tokenOf(req: Request) { return req.headers.get('Authorization')?.replace(/^Bearer /, '') || ''; }
async function update(code: string, fn: (r: Room) => unknown) {
  const db = database();
  for (let attempt = 0; attempt < 8; attempt++) {
    const row = await db.prepare('SELECT state, version FROM rooms WHERE code = ? AND expires > ?').bind(code, Date.now()).first<{ state: string; version: number }>();
    if (!row) throw new Error('Garden not found. Check the code or create a new one.');
    const room = JSON.parse(row.state) as Room; const before = JSON.stringify(room);
    tick(room); const result = fn(room);
    if (JSON.stringify(room) === before) return { room, result };
    room.version = row.version + 1;
    const saved = await db.prepare('UPDATE rooms SET state = ?, version = ? WHERE code = ? AND version = ?').bind(JSON.stringify(room), room.version, code, row.version).run();
    if (saved.meta.changes === 1) return { room, result };
  }
  throw new Error('The garden is busy. Please try that move again.');
}
export async function GET(req: Request) {
  try { const code = codeOf(new URL(req.url).searchParams.get('code')), token = tokenOf(req); const { room, result } = await update(code, r => { const p = r.players.find(p => p.token === token); if (!p) throw new Error('Your seat could not be verified. Rejoin with the room code.'); return p.id; }); return json(publicView(room, String(result))); }
  catch (e) { return json({ error: e instanceof Error ? e.message : 'Could not connect to the garden.' }, 400); }
}
export async function POST(req: Request) {
  try {
    const origin = req.headers.get('Origin'); if (origin && origin !== new URL(req.url).origin) return json({ error: 'Please open the game directly.' }, 403);
    if (Number(req.headers.get('Content-Length') || 0) > 4096) return json({ error: 'Request too large.' }, 413);
    const raw = await req.text(); if (raw.length > 4096) return json({ error: 'Request too large.' }, 413);
    const body = JSON.parse(raw); const action = body.action;
    if (action === 'create') {
      const player = newPlayer(body.name), db = database();
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      for (let i = 0; i < 8; i++) {
        const code = Array.from(crypto.getRandomValues(new Uint8Array(6)), n => alphabet[n % alphabet.length]).join('');
        const room = newRoom(code); room.players.push(player);
        const inserted = await db.prepare('INSERT OR IGNORE INTO rooms (code,state,version,expires) VALUES (?,?,0,?)').bind(code, JSON.stringify(room), room.expires).run();
        if (inserted.meta.changes === 1) return json({ token: player.token, view: publicView(room, player.id) });
      } throw new Error('Could not create a garden. Please try again.');
    }
    const code = codeOf(body.code);
    if (action === 'join') {
      const player = newPlayer(body.name);
      const { room } = await update(code, r => { if (r.phase !== 'lobby') throw new Error('This expedition is underway. Join after the players choose Rematch.'); if (r.players.length >= 8) throw new Error('This garden has all eight players.'); r.players.push(player); });
      return json({ token: player.token, view: publicView(room, player.id) });
    }
    const token = tokenOf(req);
    const { room, result } = await update(code, r => { const p = r.players.find(p => p.token === token); if (!p) throw new Error('Your seat could not be verified.'); act(r, p, action, body.value); return p.id; });
    if (action === 'leave') return json({ left: true });
    return json({ view: publicView(room, String(result)) });
  } catch (e) { return json({ error: e instanceof Error ? e.message : 'Something went wrong. Please try again.' }, 400); }
}

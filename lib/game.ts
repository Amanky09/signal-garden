export const HUES = ['Coral', 'Mint', 'Gold', 'Violet'];
export const COLORS = ['#ff8da1', '#8be6c4', '#f7ce7e', '#bba2ff'];
export type Flower = { id: number; hue: number; petals: number };
export type Player = { id: string; token: string; name: string; score: number; signal: number | null; choice: number | null };
export type RoundResult = { target: Flower; team: boolean; players: { id: string; name: string; correct: boolean; bonus: boolean; gained: number; score: number; choice: number | null }[] };
export type Room = { code: string; version: number; phase: 'lobby' | 'playing' | 'reveal' | 'finished'; round: number; players: Player[]; flowers: Flower[]; target: number; deadline: number; revealedAt: number; expires: number; results: RoundResult[] };
export function newRoom(code: string, now = Date.now()): Room { return { code, version: 0, phase: 'lobby', round: 0, players: [], flowers: [], target: -1, deadline: 0, revealedAt: 0, expires: now + 12 * 3600_000, results: [] }; }
export function cleanName(value: unknown) { const name = String(value || '').trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 20); if (!name) throw new Error('Enter a name to join the garden.'); return name; }
export function newPlayer(name: unknown): Player { return { id: crypto.randomUUID(), token: crypto.randomUUID() + crypto.randomUUID(), name: cleanName(name), score: 0, signal: null, choice: null }; }
function randomInt(n: number) { const max = Math.floor(0x100000000 / n) * n; let v; do { v = crypto.getRandomValues(new Uint32Array(1))[0]; } while (v >= max); return v % n; }
export function startRound(room: Room, now: number) {
  room.round++; room.phase = 'playing'; room.deadline = now + 60_000;
  const hues = room.round === 1 ? 3 : 4, petalTypes = room.round === 3 ? 4 : 3;
  const flowers: Flower[] = [];
  for (let hue = 0; hue < hues; hue++) for (let k = 0; k < petalTypes; k++) flowers.push({ id: hue * 4 + k, hue, petals: k + 3 });
  for (let i = flowers.length - 1; i > 0; i--) { const j = randomInt(i + 1); [flowers[i], flowers[j]] = [flowers[j], flowers[i]]; }
  room.flowers = flowers; room.target = flowers[randomInt(flowers.length)].id;
  room.players.forEach(p => { p.signal = null; p.choice = null; });
}
export function reveal(room: Room, now: number) {
  if (room.phase !== 'playing') return;
  const team = room.players.every(p => p.choice === room.target);
  const players = room.players.map(p => { const correct = p.choice === room.target, bonus = correct && p.signal === room.target; const gained = (correct ? 100 : 0) + (team ? 50 : 0) + (bonus ? 25 : 0); p.score += gained; return { id: p.id, name: p.name, correct, bonus, gained, score: p.score, choice: p.choice }; });
  room.results.push({ target: room.flowers.find(f => f.id === room.target)!, team, players });
  room.phase = room.round === 3 ? 'finished' : 'reveal'; room.revealedAt = now;
}
export function tick(room: Room, now = Date.now()) { if (room.phase === 'playing' && now >= room.deadline) { reveal(room, now); return true; } return false; }
export function act(room: Room, player: Player, action: string, value?: unknown, now = Date.now()) {
  tick(room, now);
  if (action === 'start') { if (room.phase !== 'lobby') throw new Error('The expedition has already started.'); if (room.players.length < 2) throw new Error('Invite at least one friend before starting.'); startRound(room, now); }
  else if (action === 'signal' || action === 'lock') {
    if (room.phase !== 'playing') throw new Error('This round has ended.');
    if (player.choice !== null) throw new Error('Your answer is already locked.');
    if (!Number.isInteger(value) || !room.flowers.some(f => f.id === value)) throw new Error('Choose a flower from this round.');
    if (action === 'signal') player.signal = value as number;
    else { player.choice = value as number; if (room.players.every(p => p.choice !== null)) reveal(room, now); }
  } else if (action === 'next') { if (room.phase !== 'reveal') throw new Error('Wait for the round results.'); if (now - room.revealedAt < 2500) throw new Error('Take a moment to see the results.'); startRound(room, now); }
  else if (action === 'rematch') { if (room.phase !== 'finished') throw new Error('Finish this expedition first.'); room.phase = 'lobby'; room.round = 0; room.results = []; room.flowers = []; room.target = -1; room.players.forEach(p => { p.score = 0; p.choice = null; p.signal = null; }); }
  else if (action === 'leave') { if (room.phase !== 'lobby') throw new Error('You can leave between expeditions.'); room.players = room.players.filter(p => p.id !== player.id); }
  else throw new Error('Unknown action.');
}
export function publicView(room: Room, playerId: string) {
  const p = room.players.find(p => p.id === playerId); if (!p) throw new Error('Your seat is no longer in this room.');
  const index = room.players.findIndex(p => p.id === playerId), role = (index + room.round) % 2 === 0 ? 'hue' : 'petals';
  const target = room.flowers.find(f => f.id === room.target);
  return { code: room.code, version: room.version, phase: room.phase, round: room.round, deadline: room.deadline, serverNow: Date.now(), revealedAt: room.revealedAt, flowers: room.flowers, results: room.results,
    players: room.players.map(x => ({ id: x.id, name: x.name, score: x.score, signal: x.signal, locked: x.choice !== null })),
    me: { id: p.id, name: p.name, choice: p.choice, role, clue: room.phase === 'playing' && target ? (role === 'hue' ? HUES[target.hue] : String(target.petals)) : null } };
}

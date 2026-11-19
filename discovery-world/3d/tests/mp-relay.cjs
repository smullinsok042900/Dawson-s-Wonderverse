// (build 52) A tiny stand-in for the online service, for testing PLAY TOGETHER with independent browsers on one machine.
// Rooms of up to 4; each message from one player goes to the others in the room; a closed connection = "left".
// (build 56) A room also keeps the shared world (its objects) and hands it to newcomers, exactly as the database does, so
// the two-browser test can build, paint and wave together without any network.
// usage: node tests/mp-relay.cjs [port]  (or require it: start(port) -> { close })
const { WebSocketServer } = require('ws');
function start(port = 8787, opts = {}) {
  let relay; const LAT = opts.latency || 0; /* (build 100: an optional network delay, in ms, for each message) */
  const wss = new WebSocketServer({ port }), rooms = new Map();
  wss.on('connection', ws0 => { let room = null, id = null; const ws = LAT ? { send: m => setTimeout(() => { try { ws0.send(m); } catch (e) { } }, LAT * (.6 + Math.random() * .8)) } : ws0;
    const here = () => rooms.get(room) || new Map();
    const others = () => [...here().entries()].filter(([k]) => k !== id);
    const out = () => { if (!room) return; const r = here(); r.delete(id); /* (build 100: like the database's onDisconnect: this player's seat and the vehicles they started go too) */ if (r.live) for (const [k, v] of Object.entries(r.live)) if (k === 's_' + id || (v && v.host === id)) { delete r.live[k]; for (const [, o] of r) o.ws.send(JSON.stringify({ type: 'live', key: k, obj: null })); } for (const [, o] of r) o.ws.send(JSON.stringify({ type: 'gone', id })); if (!r.size) rooms.delete(room); room = null; };
    ws0.on('message', buf => { const m = JSON.parse(buf);
      if (m.type === 'join') { const r = rooms.get(m.room) || new Map(); if (r.size >= 4 && !r.has(m.id)) { ws.send(JSON.stringify({ type: 'joined', full: true })); return; }
        out(); room = m.room; id = m.id; rooms.set(room, r); r.set(id, { ws, state: m.state }); ws.send(JSON.stringify({ type: 'joined' }));
        for (const [k, obj] of Object.entries(r.objects || {})) ws.send(JSON.stringify({ type: 'obj', key: k, obj }));
        ws.send(JSON.stringify({ type: 'clock', t: Date.now() })); for (const [k, obj] of Object.entries(r.live || {})) ws.send(JSON.stringify({ type: 'live', key: k, obj }));
        for (const [k, o] of others()) { ws.send(JSON.stringify({ type: 'player', id: k, state: o.state })); o.ws.send(JSON.stringify({ type: 'player', id, state: m.state })); if (o.voice) ws.send(JSON.stringify({ type: 'voice', id: k, on: true })); } }
      if (m.type === 'state' && room) { const me = here().get(id); if (me) me.state = m.state; for (const [, o] of others()) o.ws.send(JSON.stringify({ type: 'player', id, state: m.state })); }
      if (m.type === 'obj' && room) { const r = here(); r.objects = { ...(r.objects || {}) }; if (m.obj == null) delete r.objects[m.key]; else r.objects[m.key] = m.obj; for (const [, o] of others()) o.ws.send(JSON.stringify({ type: 'obj', key: m.key, obj: m.obj })); }
      if (m.type === 'evt' && room) for (const [, o] of others()) o.ws.send(JSON.stringify({ type: 'evt', evt: m.evt }));
      if (m.type === 'live' && room && /^[fs]_[\w-]{1,60}$/.test(m.key)) { const r = here(); r.live = { ...(r.live || {}) }; if (m.obj == null) delete r.live[m.key]; else r.live[m.key] = m.obj; for (const [, o] of others()) o.ws.send(JSON.stringify({ type: 'live', key: m.key, obj: m.obj })); }
      // (build 62) talking: who has it on, and call set-up messages to ONE player of the same room (never anyone else)
      if (m.type === 'voice' && room) { const me = here().get(id); if (me) me.voice = !!m.on; for (const [, o] of others()) o.ws.send(JSON.stringify({ type: 'voice', id, on: !!m.on })); }
      if (m.type === 'sig' && room) { const to = here().get(m.to); if (to && m.to !== id) { to.ws.send(JSON.stringify({ type: 'sig', from: id, msg: m.msg })); relay.signals = (relay.signals || 0) + 1; } }
      if (m.type === 'leave') out(); });
    ws0.on('close', out); });
  relay = { close: () => wss.close(), rooms };
  return relay;
}
if (require.main === module) { start(+process.argv[2] || 8787); console.log('relay on', +process.argv[2] || 8787); }
module.exports = { start };

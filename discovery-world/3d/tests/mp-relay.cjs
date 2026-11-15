// (build 52) A tiny stand-in for the online service, for testing PLAY TOGETHER with independent browsers on one machine.
// Rooms of up to 4; each message from one player goes to the others in the room; a closed connection = "left".
// usage: node tests/mp-relay.cjs [port]  (or require it: start(port) -> { close })
const { WebSocketServer } = require('ws');
function start(port = 8787) {
  const wss = new WebSocketServer({ port }), rooms = new Map();
  wss.on('connection', ws => { let room = null, id = null;
    const others = () => [...(rooms.get(room) || new Map()).entries()].filter(([k]) => k !== id);
    const out = () => { if (!room) return; const r = rooms.get(room); if (r) { r.delete(id); for (const [, o] of r) o.ws.send(JSON.stringify({ type: 'gone', id })); if (!r.size) rooms.delete(room); } room = null; };
    ws.on('message', buf => { const m = JSON.parse(buf);
      if (m.type === 'join') { const r = rooms.get(m.room) || new Map(); if (r.size >= 4 && !r.has(m.id)) { ws.send(JSON.stringify({ type: 'joined', full: true })); return; }
        out(); room = m.room; id = m.id; rooms.set(room, r); r.set(id, { ws, state: m.state }); ws.send(JSON.stringify({ type: 'joined' }));
        for (const [k, o] of others()) { ws.send(JSON.stringify({ type: 'player', id: k, state: o.state })); o.ws.send(JSON.stringify({ type: 'player', id, state: m.state })); } }
      if (m.type === 'state' && room) { const me = rooms.get(room).get(id); me.state = m.state; for (const [, o] of others()) o.ws.send(JSON.stringify({ type: 'player', id, state: m.state })); }
      if (m.type === 'leave') out(); });
    ws.on('close', out); });
  return { close: () => wss.close(), rooms };
}
if (require.main === module) { start(+process.argv[2] || 8787); console.log('relay on', +process.argv[2] || 8787); }
module.exports = { start };

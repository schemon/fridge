import http from 'node:http';
import { URL } from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';

const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseInt(process.env.PORT || '8080', 10);
const SESSIONS_DIR = process.env.FRIDGE_SESSIONS_DIR || '/home/sixten/fridge-captures/sessions';

function send(res, status, body, headers = {}) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
  res.writeHead(status, {
    'content-length': buf.length,
    ...headers,
  });
  res.end(buf);
}

function sendJson(res, status, obj) {
  send(res, status, JSON.stringify(obj, null, 2) + '\n', {
    'content-type': 'application/json',
  });
}

function notFound(res) {
  sendJson(res, 404, { error: 'not_found' });
}

async function parseMeta(dir) {
  try {
    const txt = await fs.readFile(path.join(dir, 'meta.txt'), 'utf8');
    const meta = {};
    for (const line of txt.split('\n')) {
      const eq = line.indexOf('=');
      if (eq > 0) meta[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }
    return meta;
  } catch {
    return {};
  }
}

async function parseStatus(dir) {
  try {
    return JSON.parse(await fs.readFile(path.join(dir, 'analysis', 'status.json'), 'utf8'));
  } catch {
    return null;
  }
}

async function listSessions() {
  let entries;
  try {
    entries = await fs.readdir(SESSIONS_DIR, { withFileTypes: true });
  } catch {
    return [];
  }

  const ids = entries.filter(e => e.isDirectory()).map(e => e.name).sort();

  return Promise.all(ids.map(async (id) => {
    const dir = path.join(SESSIONS_DIR, id);
    const [status, meta] = await Promise.all([parseStatus(dir), parseMeta(dir)]);
    return { session_id: id, status, meta };
  }));
}

async function getSession(id) {
  const dir = path.join(SESSIONS_DIR, id);
  try {
    await fs.stat(dir);
  } catch {
    return null;
  }

  const [status, meta] = await Promise.all([parseStatus(dir), parseMeta(dir)]);

  let transactions = [];
  try {
    const raw = await fs.readFile(path.join(dir, 'analysis', 'transactions.jsonl'), 'utf8');
    transactions = raw.split('\n').filter(Boolean).map(l => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch {}

  let frames = [];
  try {
    const names = await fs.readdir(path.join(dir, 'analysis', 'frames'));
    frames = names.filter(f => /\.(png|jpg)$/i.test(f)).sort();
  } catch {}

  return { session_id: id, status, meta, transactions, frames };
}

// Validate path segments to prevent traversal
function safeId(s) {
  return /^[\w.-]+$/.test(s) ? s : null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);

  try {
    // GET /
    if (parts.length === 0) {
      return sendJson(res, 200, { ok: true, sessions_dir: SESSIONS_DIR });
    }

    // GET /sessions
    if (parts[0] === 'sessions' && parts.length === 1) {
      return sendJson(res, 200, await listSessions());
    }

    // GET /sessions/:id
    if (parts[0] === 'sessions' && parts.length === 2) {
      const id = safeId(parts[1]);
      if (!id) return notFound(res);
      const session = await getSession(id);
      if (!session) return notFound(res);
      return sendJson(res, 200, session);
    }

    // GET /sessions/:id/frames/:file
    if (parts[0] === 'sessions' && parts.length === 4 && parts[2] === 'frames') {
      const id = safeId(parts[1]);
      const file = safeId(parts[3]);
      if (!id || !file) return notFound(res);
      const framePath = path.join(SESSIONS_DIR, id, 'analysis', 'frames', file);
      try {
        const data = await fs.readFile(framePath);
        const ct = /\.jpe?g$/i.test(file) ? 'image/jpeg' : 'image/png';
        return send(res, 200, data, { 'content-type': ct });
      } catch {
        return notFound(res);
      }
    }

    notFound(res);
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: 'internal_server_error' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`fridge-api listening on http://${HOST}:${PORT}`);
  console.log(`sessions_dir: ${SESSIONS_DIR}`);
});

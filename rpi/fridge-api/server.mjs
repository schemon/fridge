import http from 'node:http';
import { URL } from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseInt(process.env.PORT || '8080', 10);
const SESSIONS_DIR = process.env.FRIDGE_SESSIONS_DIR || '/home/sixten/fridge-captures/sessions';
const HISTORY_DIR  = process.env.FRIDGE_HISTORY_DIR  || '/home/sixten/fridge-captures/history';
const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(process.cwd(), 'public');
const MAX_SESSIONS_BYTES = parseInt(process.env.FRIDGE_MAX_SESSIONS_BYTES || String(5  * 1024 * 1024 * 1024), 10);
const MAX_HISTORY_BYTES  = parseInt(process.env.FRIDGE_MAX_HISTORY_BYTES  || String(20 * 1024 * 1024 * 1024), 10);

// ---- helpers ----

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

// ---- static file serving ----

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
}

async function serveStatic(res, pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return notFound(res); }

  // prevent path traversal
  const rel = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, rel);

  let data;
  try {
    data = await fs.readFile(filePath);
  } catch {
    // SPA fallback
    try {
      data = await fs.readFile(path.join(PUBLIC_DIR, 'index.html'));
      return send(res, 200, data, { 'content-type': 'text/html; charset=utf-8' });
    } catch {
      return notFound(res);
    }
  }

  const ct = MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
  send(res, 200, data, { 'content-type': ct });
}

// ---- sessions data ----

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
  // Stills pipeline writes status.json at session root;
  // video pipeline writes it under analysis/. Try both.
  for (const rel of ['status.json', 'analysis/status.json']) {
    try {
      return JSON.parse(await fs.readFile(path.join(dir, rel), 'utf8'));
    } catch {}
  }
  return null;
}

async function parseTxSummary(dir) {
  try {
    const raw = await fs.readFile(path.join(dir, 'analysis', 'transactions.jsonl'), 'utf8');
    const counts = {};
    for (const line of raw.split('\n').filter(Boolean)) {
      try { const { type } = JSON.parse(line); if (type) counts[type] = (counts[type] || 0) + 1; } catch {}
    }
    return counts;
  } catch {
    return {};
  }
}

async function listDir(baseDir) {
  let entries;
  try {
    entries = await fs.readdir(baseDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const ids = entries.filter(e => e.isDirectory()).map(e => e.name).sort().reverse();
  return Promise.all(ids.map(async (id) => {
    const dir = path.join(baseDir, id);
    const [status, meta, tx_summary] = await Promise.all([parseStatus(dir), parseMeta(dir), parseTxSummary(dir)]);
    return { session_id: id, status, meta, tx_summary };
  }));
}

async function listSessions() { return listDir(SESSIONS_DIR); }
async function listHistory()  { return listDir(HISTORY_DIR); }

async function getSessionFrom(baseDir, id) {
  const dir = path.join(baseDir, id);
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

  // Stills sessions store frames at session_dir/frames/
  // Video sessions store frames at session_dir/analysis/frames/ (after analyze)
  let frames = [];
  let framesSubdir = 'analysis/frames';
  for (const candidate of ['analysis/frames', 'frames']) {
    try {
      const names = await fs.readdir(path.join(dir, candidate));
      const matches = names.filter(f => /\.(png|jpg)$/i.test(f)).sort();
      if (matches.length > 0) { frames = matches; framesSubdir = candidate; break; }
    } catch {}
  }

  return { session_id: id, status, meta, transactions, frames, frames_subdir: framesSubdir };
}

async function getSession(id)        { return getSessionFrom(SESSIONS_DIR, id); }
async function getHistorySession(id) { return getSessionFrom(HISTORY_DIR, id); }

// ---- stats (disk usage) ----

async function duBytes(dirPath) {
  try {
    const { stdout } = await execFileAsync('du', ['-sk', dirPath]);
    return parseInt(stdout.trim().split(/\s+/)[0], 10) * 1024;
  } catch {
    return null;
  }
}

async function getStats() {
  const [sessions_bytes, history_bytes] = await Promise.all([
    duBytes(SESSIONS_DIR),
    duBytes(HISTORY_DIR),
  ]);

  const total_max = MAX_SESSIONS_BYTES + MAX_HISTORY_BYTES;
  const total_used = (sessions_bytes ?? 0) + (history_bytes ?? 0);

  const pct = (used, max) =>
    used != null && max ? Math.round((used / max) * 1000) / 10 : null;

  return {
    disk_usage_total: {
      used_bytes: total_used,
      max_bytes: total_max,
      used_pct: pct(total_used, total_max),
    },
    disk_usage_sessions: {
      used_bytes: sessions_bytes,
      max_bytes: MAX_SESSIONS_BYTES,
      used_pct: pct(sessions_bytes, MAX_SESSIONS_BYTES),
    },
    disk_usage_history: {
      used_bytes: history_bytes,
      max_bytes: MAX_HISTORY_BYTES,
      used_pct: pct(history_bytes, MAX_HISTORY_BYTES),
    },
  };
}

function safeId(s) {
  return /^[\w.-]+$/.test(s) ? s : null;
}

// ---- request handler ----

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);

  try {
    // GET /stats
    if (parts[0] === 'stats' && parts.length === 1) {
      return sendJson(res, 200, await getStats());
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
      const ct = /\.jpe?g$/i.test(file) ? 'image/jpeg' : 'image/png';
      for (const subdir of ['analysis/frames', 'frames']) {
        try {
          const data = await fs.readFile(path.join(SESSIONS_DIR, id, subdir, file));
          return send(res, 200, data, { 'content-type': ct });
        } catch {}
      }
      return notFound(res);
    }

    // GET /history
    if (parts[0] === 'history' && parts.length === 1) {
      return sendJson(res, 200, await listHistory());
    }

    // GET /history/:id
    if (parts[0] === 'history' && parts.length === 2) {
      const id = safeId(parts[1]);
      if (!id) return notFound(res);
      const session = await getHistorySession(id);
      if (!session) return notFound(res);
      return sendJson(res, 200, session);
    }

    // GET /history/:id/frames/:file
    if (parts[0] === 'history' && parts.length === 4 && parts[2] === 'frames') {
      const id = safeId(parts[1]);
      const file = safeId(parts[3]);
      if (!id || !file) return notFound(res);
      const ct = /\.jpe?g$/i.test(file) ? 'image/jpeg' : 'image/png';
      for (const subdir of ['analysis/frames', 'frames']) {
        try {
          const data = await fs.readFile(path.join(HISTORY_DIR, id, subdir, file));
          return send(res, 200, data, { 'content-type': ct });
        } catch {}
      }
      return notFound(res);
    }

    // Static files (React UI)
    await serveStatic(res, url.pathname);
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: 'internal_server_error' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`fridge-api listening on http://${HOST}:${PORT}`);
  console.log(`sessions_dir: ${SESSIONS_DIR}`);
  console.log(`public_dir:   ${PUBLIC_DIR}`);
});

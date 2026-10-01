#!/usr/bin/env node
// Minimal zero-dependency static server for local development / verification.
// The app itself has no build step — this only serves the folder so the PWA
// (service worker, manifest, install) behaves like it does on a real origin.
//
//   node tools/serve.js [port]      → http://localhost:8753
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = parseInt(process.argv[2] || process.env.PORT || '8753', 10);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json'
};

const SHELL = new Set(['index.html','pf_workout_tracker.html','sw.js','manifest.json','icon-192.png','icon-512.png']);
http.createServer(function (req, res) {
  let rel;
  try { rel = decodeURIComponent(req.url.split('?')[0]); }
  catch (_) { res.writeHead(400).end('Invalid URL'); return; }
  if (rel === '/') rel = '/index.html';
  // This app only needs six public shell files. Never expose local API-key files,
  // Git metadata, backups, or arbitrary paths from the development directory.
  const relative = rel.replace(/^[/\\]+/, '');
  if (!SHELL.has(relative)) { res.writeHead(404).end('Not found'); return; }
  const file = path.resolve(ROOT, relative);
  fs.readFile(file, function (err, buf) {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found: ' + rel); return; }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(buf);
  });
}).listen(PORT, function () {
  console.log('PF Fitness Tracker dev server → http://localhost:' + PORT + '/pf_workout_tracker.html');
});

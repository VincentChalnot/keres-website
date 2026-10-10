// Zero-dependency static server so /fonts/... and /images/... resolve at the root, like in the real apps.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const [root = 'styleguide', port = '4173'] = process.argv.slice(2);
const base = resolve(root);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.webp': 'image/webp', '.png': 'image/png' };

createServer(async (req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  let file = join(base, path);
  if (!file.startsWith(base)) { res.writeHead(403).end(); return; }
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch {}
  try {
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(await readFile(file));
  } catch { res.writeHead(404).end('Not found'); }
}).listen(Number(port), () => console.log(`Style guide: http://localhost:${port}`));

// deploy/ 폴더를 로컬 주소로 띄워 두는 도구(Lighthouse 등 수동 확인용): node dev/tools/serve-deploy.mjs [포트]
import { serve } from '../lib/harness.mjs';
const port = Number(process.argv[2]) || 4173;
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { root } from '../lib/harness.mjs';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain' };
const dir = path.join(root, 'deploy');
http.createServer((req, res) => { let f = path.join(dir, decodeURIComponent(req.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(fs.readFileSync(f)); }).listen(port, () => console.log('http://localhost:' + port));

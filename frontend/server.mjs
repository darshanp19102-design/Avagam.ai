import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = __dirname;
const envPath = path.join(root, '.env');
const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const readEnv = (name) => (env.split('\n').find((l) => l.startsWith(`${name}=`)) || '').split('=').slice(1).join('=').trim();

const apiUrl = readEnv('VITE_API_URL');
const apiProxyUrl = readEnv('API_PROXY_URL') || 'http://localhost:8000';

const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
};

function proxyToApi(req, res) {
  const target = new URL(req.url, apiProxyUrl);
  const proxyReq = http.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || 80,
      path: `${target.pathname}${target.search}`,
      method: req.method,
      headers: {
        ...req.headers,
        host: target.host,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ detail: 'Backend unavailable via proxy' }));
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const reqPath = req.url.split('?')[0];

  if (reqPath.startsWith('/api/') || reqPath === '/health') {
    proxyToApi(req, res);
    return;
  }

  if (reqPath === '/env.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(`window.__APP_ENV__ = { API_URL: ${JSON.stringify(apiUrl)} };`);
    return;
  }

  let filePath = path.join(root, reqPath === '/' ? '/index.html' : reqPath);
  if (!filePath.startsWith(root)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(root, 'index.html');
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
  res.end(fs.readFileSync(filePath));
});

server.listen(5173, '0.0.0.0', () => console.log('Frontend running at http://0.0.0.0:5173'));

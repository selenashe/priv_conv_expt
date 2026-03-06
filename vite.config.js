import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  base: '/priv_conv_expt/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  plugins: [
    {
      name: 'save-results-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.method !== 'POST' || req.url !== '/api/save-results') return next();
          const chunks = [];
          req.on('data', (chunk) => chunks.push(chunk));
          req.on('end', () => {
            try {
              const body = Buffer.concat(chunks).toString('utf8');
              const { data, csv } = JSON.parse(body);
              const pid = (data && data.participant_id) || 'unknown';
              const dir = path.resolve(process.cwd(), 'results');
              fs.mkdirSync(dir, { recursive: true });
              fs.writeFileSync(path.join(dir, `privacy_norm_expt_${pid}.json`), JSON.stringify(data, null, 2), 'utf8');
              fs.writeFileSync(path.join(dir, `privacy_norm_expt_${pid}.csv`), csv || '', 'utf8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: String(err.message) }));
            }
          });
          req.on('error', () => next());
        });
      },
    },
  ],
});

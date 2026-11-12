import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'all-routes-404-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = (req.url || '').split('?')[0];

          // Allow vite internal endpoints, modules, static assets, and api proxies
          if (
            url.startsWith('/@') ||
            url.startsWith('/src') ||
            url.startsWith('/node_modules') ||
            url.startsWith('/api') ||
            (path.extname(url) && path.extname(url) !== '.html')
          ) {
            return next();
          }

          // Return genuine HTTP 404 for EVERY frontend route (including / and all others)
          const notFoundFile = path.resolve(__dirname, 'public/404.html');
          if (fs.existsSync(notFoundFile)) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(fs.readFileSync(notFoundFile));
            return;
          }
          next();
        });
      }
    }
  ],
})

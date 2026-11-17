import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react';
import remarkGfm from 'remark-gfm';
import { defineConfig } from 'vite';
import type { Connect, Plugin } from 'vite';
import { handleApi } from './server/api.ts';

/** Hängt die Code-Ausführungs-API direkt in den Vite-Server ein: ein Prozess, ein Port. */
function codepfadApi(): Plugin {
  const mount = (middlewares: Connect.Server) => {
    middlewares.use((req, res, next) => {
      if (req.url?.startsWith('/api/')) void handleApi(req, res);
      else next();
    });
  };
  return {
    name: 'codepfad-api',
    configureServer: (server) => mount(server.middlewares),
    configurePreviewServer: (server) => mount(server.middlewares),
  };
}

export default defineConfig({
  plugins: [{ enforce: 'pre', ...mdx({ remarkPlugins: [remarkGfm] }) }, react(), codepfadApi()],
  // Nur lokal erreichbar – der Server führt Code aus.
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
});

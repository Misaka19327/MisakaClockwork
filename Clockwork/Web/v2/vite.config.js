import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Clockwork integration contract (matches the previous v2):
// - base './'            : assets referenced relatively, so the app works at any sub-path
// - build.outDir '../public/v2' : emit into Clockwork\Web\public\v2, served by Web.php
// The app uses HashRouter, so no server-side SPA fallback is required.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../public/v2',
    // Don't rmSync outDir before writing: on Windows the PHP dev server / browser often holds the
    // previous build's assets open, making emptyDir fail with EPERM. Vite still overwrites index.html
    // and emits fresh-hashed JS; the CSS keeps a stable hash so it's overwritten in place. Stale
    // old-hash JS files accumulate harmlessly (index.html only ever references the latest). Flip to
    // true only when nothing is locking assets and you want a clean slate.
    emptyOutDir: false
  },
  server: {
    port: 5173,
    open: true,
    host: true,
    allowedHosts: ['host.docker.internal', 'localhost', '127.0.0.1'],
    // In dev, proxy the Clockwork API to the Laravel test app (prod is same-origin).
    proxy: {
      '/__clockwork': {
        target: process.env.VITE_CLOCKWORK_API_TARGET || 'http://127.0.0.1:8090',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4173,
    host: true,
    allowedHosts: ['host.docker.internal', 'localhost', '127.0.0.1']
  }
})

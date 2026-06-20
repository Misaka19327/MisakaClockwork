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
    emptyOutDir: true
  },
  server: {
    port: 5173,
    open: true,
    host: true,
    allowedHosts: ['host.docker.internal', 'localhost', '127.0.0.1']
  },
  preview: {
    port: 4173,
    host: true,
    allowedHosts: ['host.docker.internal', 'localhost', '127.0.0.1']
  }
})

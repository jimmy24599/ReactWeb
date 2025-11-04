import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './@'),
    },
  },
  server: {
    host: '0.0.0.0', // Makes Vite accessible from outside the container
    port: 5173,
    strictPort: true, // Fails if port is already in use
    watch: {
      usePolling: true, // Necessary for hot reload in Docker
    },
  },
})

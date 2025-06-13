import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/NestedToDoList/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.replit.dev',
      'fbbf6258-1afa-455e-9e29-32c5824a5472-00-1z02oce2o3cze.worf.replit.dev'
    ]
  }
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // In dev, proxy /api to the local FastAPI server so VITE_API_URL isn't needed
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Output directly into the backend package so FastAPI can serve it
    outDir: '../backend/static',
    emptyOutDir: true,
  },
})

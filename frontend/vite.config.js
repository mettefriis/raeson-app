import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  },
  define: {
    // VITE_API_URL is set in Vercel environment variables
    // Falls back to empty string (relative URLs) for local dev
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || '')
  }
})

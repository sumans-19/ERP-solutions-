import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
  tailwindcss()
  ],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://10.98.94.149:5001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

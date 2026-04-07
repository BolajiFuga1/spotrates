import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env') })

const apiPort = Number(process.env.PORT || 3001)
const apiTarget = `http://127.0.0.1:${apiPort}`

const apiProxy = {
  '/api': {
    target: apiTarget,
    changeOrigin: true,
    cookieDomainRewrite: '',
    cookiePathRewrite: '/',
  },
} as const

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: { ...apiProxy },
  },
  preview: {
    proxy: { ...apiProxy },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin.html'),
      },
    },
  },
})

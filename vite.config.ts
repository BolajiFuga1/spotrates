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

// GitHub Pages project site: build with VITE_BASE_PATH=/spotrates/ (repo name, slashes optional).
const rawBase = (process.env.VITE_BASE_PATH && process.env.VITE_BASE_PATH.trim()) || './'
const viteBase =
  rawBase === './' || rawBase === '.'
    ? './'
    : rawBase.startsWith('/')
      ? rawBase.endsWith('/')
        ? rawBase
        : `${rawBase}/`
      : rawBase.endsWith('/')
        ? `/${rawBase}`
        : `/${rawBase}/`

// https://vite.dev/config/
export default defineConfig({
  base: viteBase,
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

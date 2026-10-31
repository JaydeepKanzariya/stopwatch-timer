import { readFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

interface HeaderRule {
  source: string
  headers: { key: string; value: string }[]
}

// `vite preview` serves the same security headers as Vercel (vercel.json is
// the single source of truth), so local runs and end-to-end tests would catch
// a CSP violation before it reaches production.
const vercel = JSON.parse(
  readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'),
) as { headers: HeaderRule[] }

const siteHeaders = Object.fromEntries(
  (vercel.headers.find((rule) => rule.source === '/(.*)')?.headers ?? []).map(
    ({ key, value }) => [key, value],
  ),
)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  preview: { headers: siteHeaders },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
})

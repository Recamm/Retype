import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import deployment from './vercel.json' with { type: 'json' }

export default defineConfig({
  plugins: [react()],
  preview: {
    headers: Object.fromEntries(
      deployment.headers[0].headers.map((header) => [header.key, header.value]),
    ),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})

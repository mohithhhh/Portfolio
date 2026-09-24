import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      // `server-only` throws outside the Next.js server bundle; tests import server helpers directly.
      'server-only': fileURLToPath(new URL('./tests/stubs/empty.ts', import.meta.url)),
      '@content': fileURLToPath(new URL('./content', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
})

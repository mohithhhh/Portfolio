import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3300)
// Optional: point at a preinstalled Chromium instead of Playwright's download.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: { executablePath },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } }, testIgnore: /ios\.spec/ },
    { name: 'phone', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' }, testMatch: /ios\.spec/ },
  ],
  webServer: {
    command: `pnpm start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    env: { AGENT_MOCK: '1' },
    timeout: 60_000,
  },
})

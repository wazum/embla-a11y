import { defineConfig, devices } from '@playwright/test'

const isCi = process.env.CI === 'true'

export default defineConfig({
  testDir: 'e2e',
  testIgnore: 'screenreader/**',
  forbidOnly: isCi,
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    connectOptions: isCi
      ? undefined
      : { wsEndpoint: 'ws://127.0.0.1:3737/', exposeNetwork: '<loopback>' }
  },
  webServer: {
    command: 'vite --port 5173 --strictPort',
    url: 'http://localhost:5173/e2e/pages/basic.html',
    reuseExistingServer: !isCi
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 15'] } }
  ]
})

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  testIgnore: 'screenreader/**',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    connectOptions: process.env.CI
      ? undefined
      : { wsEndpoint: 'ws://127.0.0.1:3737/', exposeNetwork: '<loopback>' }
  },
  webServer: {
    command: 'vite --port 5173 --strictPort',
    url: 'http://localhost:5173/e2e/pages/basic.html',
    reuseExistingServer: !process.env.CI
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 15'] } }
  ]
})

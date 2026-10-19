import { devices } from '@playwright/test'
import { withGuidepup } from '@guidepup/playwright'

export default withGuidepup({
  testDir: 'e2e/screenreader',
  reportSlowTests: null,
  timeout: 5 * 60 * 1000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173'
  },
  webServer: {
    command: 'vite --port 5173 --strictPort',
    url: 'http://localhost:5173/e2e/pages/basic.html',
    reuseExistingServer: !process.env.CI
  },
  projects: [
    {
      name: process.env.SCREENREADER_BROWSER ?? 'chromium',
      use: { ...devices[process.env.SCREENREADER_BROWSER === 'firefox' ? 'Desktop Firefox' : 'Desktop Chrome'] }
    }
  ]
})

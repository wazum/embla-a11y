import { devices } from '@playwright/test'
import { withGuidepup } from '@guidepup/playwright'

const isCi = process.env.CI === 'true'
const browser = process.env.SCREENREADER_BROWSER === 'firefox' ? 'firefox' : 'chromium'

export default withGuidepup({
  testDir: 'e2e/screenreader',
  reportSlowTests: null,
  timeout: 5 * 60 * 1000,
  retries: isCi ? 2 : 0,
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173'
  },
  webServer: {
    command: 'vite --port 5173 --strictPort',
    url: 'http://localhost:5173/e2e/pages/basic.html',
    reuseExistingServer: !isCi
  },
  projects: [
    {
      name: browser,
      use: { ...devices[browser === 'firefox' ? 'Desktop Firefox' : 'Desktop Chrome'] }
    }
  ]
})

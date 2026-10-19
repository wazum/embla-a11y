import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(
        process.env.CI
          ? {}
          : { connectOptions: { wsEndpoint: 'ws://127.0.0.1:3737/', exposeNetwork: '<loopback>' } }
      ),
      instances: [
        { browser: 'chromium' },
        { browser: 'firefox' },
        { browser: 'webkit' }
      ]
    }
  }
})

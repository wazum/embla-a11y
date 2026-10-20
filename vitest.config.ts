import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { emblaAlias, usesEmblaV8 } from './emblaVersion.js'

const isCi = process.env.CI === 'true'

export default defineConfig({
  resolve: {
    alias: {
      ...emblaAlias,
      'embla-a11y': fileURLToPath(new URL('./src/index.ts', import.meta.url))
    }
  },
  define: { USES_EMBLA_V8: JSON.stringify(usesEmblaV8) },
  test: {
    include: ['test/**/*.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(
        isCi
          ? {}
          : { connectOptions: { wsEndpoint: 'ws://127.0.0.1:3737/', exposeNetwork: '<loopback>' } }
      ),
      instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }]
    }
  }
})

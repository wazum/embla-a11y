import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { emblaAlias, usesEmblaV8 } from './emblaVersion.js'

const site = '/embla-a11y/'

export default defineConfig({
  root: fileURLToPath(new URL('./demo', import.meta.url)),
  base: usesEmblaV8 ? `${site}v8/` : site,
  resolve: { alias: emblaAlias },
  server: { port: usesEmblaV8 ? 5176 : 5175 },
  build: {
    outDir: fileURLToPath(new URL(usesEmblaV8 ? './demo-dist/v8' : './demo-dist', import.meta.url)),
    emptyOutDir: true
  }
})

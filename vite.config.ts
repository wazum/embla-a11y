import { defineConfig } from 'vite'
import { emblaAlias } from './emblaVersion.js'

export default defineConfig({
  resolve: { alias: emblaAlias }
})

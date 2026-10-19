import { fileURLToPath } from 'node:url'

export const usesEmblaV8 = process.env.EMBLA === '8'

const emblaPackages = [
  'embla-carousel',
  'embla-carousel-autoplay',
  'embla-carousel-auto-scroll',
  'embla-carousel-fade'
]

export const emblaAlias: Record<string, string> = usesEmblaV8
  ? Object.fromEntries(
      emblaPackages.map((name) => [
        name,
        fileURLToPath(new URL(`./v8/node_modules/${name}`, import.meta.url))
      ])
    )
  : {}

export const demoPort = usesEmblaV8 ? 5174 : 5173

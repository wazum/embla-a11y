import EmblaCarousel from 'embla-carousel'
import { expect, test } from 'vitest'
import emblaA11y from '../src/index.js'

declare const USES_EMBLA_V8: boolean

test.skipIf(USES_EMBLA_V8)(
  'does nothing on the rootless instance framework wrappers create',
  () => {
    const create = (): unknown =>
      EmblaCarousel(null, {}, [emblaA11y({ label: 'Featured products' })])

    expect(create).not.toThrow()
  }
)

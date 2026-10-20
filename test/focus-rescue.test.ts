import { afterEach, expect, test } from 'vitest'
import emblaA11y from '../src/index.js'
import { createCarousel, removeCarousels } from './fixture.js'

const checkVisibility = Object.getOwnPropertyDescriptor(Element.prototype, 'checkVisibility')

afterEach(() => {
  removeCarousels()
  if (checkVisibility !== undefined) {
    Object.defineProperty(Element.prototype, 'checkVisibility', checkVisibility)
  }
})

test('moves focus on in browsers without checkVisibility', async () => {
  Reflect.deleteProperty(Element.prototype, 'checkVisibility')
  const { slides } = createCarousel({ plugins: [emblaA11y({ label: 'Products' })] })
  const link = slides[0]?.querySelector('a')
  link?.focus()

  link?.remove()

  await expect.poll(() => document.activeElement).toBe(slides[1]?.querySelector('a'))
})

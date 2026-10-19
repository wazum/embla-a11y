import { afterEach, expect, test } from 'vitest'
import A11y from '../src/index.js'
import { createCarousel, removeCarousels } from './fixture.js'

afterEach(removeCarousels)

test('keeps every slide readable when several slides are in view', () => {
  const { slides } = createCarousel({ plugins: [A11y({ label: 'Featured products' })] })

  const hiddenSlides = slides.filter((slide) => slide.closest('[aria-hidden="true"], [inert]'))

  expect(hiddenSlides).toEqual([])
})

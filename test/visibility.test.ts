import { afterEach, expect, test } from 'vitest'
import A11y from '../src/index'
import { createCarousel, removeCarousels } from './fixture'

afterEach(removeCarousels)

test('keeps every slide readable when several slides are in view', () => {
  const { slides } = createCarousel({ plugins: [A11y()] })

  const hiddenSlides = slides.filter((slide) => slide.closest('[aria-hidden="true"], [inert]'))

  expect(hiddenSlides).toEqual([])
})

test('turns the carousel root into a labelled region', () => {
  const { root } = createCarousel({ plugins: [A11y({ label: 'Featured products' })] })

  expect(root.getAttribute('role')).toBe('region')
  expect(root.getAttribute('aria-label')).toBe('Featured products')
})

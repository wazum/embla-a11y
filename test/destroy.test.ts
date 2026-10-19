import { afterEach, expect, test } from 'vitest'
import A11y from '../src/index.js'
import { attributesOf, createCarousel, removeCarousels } from './fixture.js'

afterEach(removeCarousels)

test('restores the original root attributes on destroy', () => {
  const { root, emblaApi } = createCarousel({
    plugins: [A11y({ label: 'Featured products' })],
    rootAttributes: { 'aria-label': 'Author label', class: 'embla' }
  })
  const attributesBeforeInit = {
    'aria-label': 'Author label',
    class: 'embla',
    style: root.style.cssText
  }

  emblaApi.destroy()

  expect(attributesOf(root)).toEqual(attributesBeforeInit)
})

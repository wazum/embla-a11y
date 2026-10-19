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

test('keeps the region through reInit and still restores the original attributes', () => {
  const { root, emblaApi } = createCarousel({
    plugins: [A11y({ label: 'Featured products' })],
    rootAttributes: { 'aria-label': 'Author label' }
  })

  emblaApi.reInit()
  emblaApi.reInit()

  expect(root.getAttribute('role')).toBe('region')
  expect(root.getAttribute('aria-label')).toBe('Featured products')

  emblaApi.destroy()

  expect(root.getAttribute('role')).toBeNull()
  expect(root.getAttribute('aria-label')).toBe('Author label')
})

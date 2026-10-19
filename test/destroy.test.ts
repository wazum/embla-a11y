import { afterEach, expect, test } from 'vitest'
import { page } from 'vitest/browser'
import A11y from '../src/index.js'
import { attributesOf, createCarousel, removeCarousels } from './fixture.js'

afterEach(removeCarousels)

test('restores the original markup on destroy', () => {
  const { wrapper, emblaApi } = createCarousel({
    plugins: [A11y({ label: 'Featured products' })],
    wrapperAttributes: { class: 'embla', 'data-carousel': 'products' }
  })

  emblaApi.destroy()

  expect(attributesOf(wrapper)).toEqual({ class: 'embla', 'data-carousel': 'products' })
})

test('keeps the region through reInit and removes it on destroy', async () => {
  const { emblaApi } = createCarousel({ plugins: [A11y({ label: 'Featured products' })] })

  emblaApi.reInit()
  emblaApi.reInit()

  await expect.element(page.getByRole('region', { name: 'Featured products' })).toBeVisible()

  emblaApi.destroy()

  expect(page.getByRole('region').elements()).toHaveLength(0)
})

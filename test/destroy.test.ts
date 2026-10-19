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

test('restores the previous and next buttons on destroy', () => {
  const { buttons, emblaApi } = createCarousel({
    plugins: ({ previous, next }) => [
      A11y({ label: 'Featured products', previousButton: previous, nextButton: next })
    ]
  })

  emblaApi.destroy()

  expect(attributesOf(buttons.previous)).toEqual({ type: 'button' })
  expect(attributesOf(buttons.next)).toEqual({ type: 'button' })
})

test('rescues focus that was already inside the carousel when the plugin started', async () => {
  const { buttons, emblaApi } = createCarousel()
  buttons.next.focus()

  emblaApi.reInit({}, [
    A11y({ label: 'Featured products', previousButton: buttons.previous, nextButton: buttons.next })
  ])
  buttons.next.disabled = true
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(document.activeElement).toBe(buttons.previous)
})

test('stops moving focus after destroy', async () => {
  const { buttons, emblaApi } = createCarousel({
    plugins: ({ previous, next }) => [
      A11y({ label: 'Featured products', previousButton: previous, nextButton: next })
    ]
  })
  buttons.next.focus()

  emblaApi.destroy()
  buttons.next.disabled = true
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(document.activeElement).not.toBe(buttons.previous)
})

test('makes hidden slides reachable again on destroy', () => {
  const { slides, emblaApi } = createCarousel({
    slideCount: 10,
    plugins: [A11y({ label: 'Featured products', hideOffscreen: true })]
  })
  const lastLink = slides[9]?.querySelector('a')

  emblaApi.destroy()
  lastLink?.focus()

  expect(document.activeElement).toBe(lastLink)
})

test('keeps the region through reInit and removes it on destroy', async () => {
  const { emblaApi } = createCarousel({ plugins: [A11y({ label: 'Featured products' })] })

  emblaApi.reInit()
  emblaApi.reInit()

  await expect.element(page.getByRole('region', { name: 'Featured products' })).toBeVisible()

  emblaApi.destroy()

  expect(page.getByRole('region').elements()).toHaveLength(0)
})

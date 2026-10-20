import { afterEach, expect, test } from 'vitest'
import emblaA11y from '../src/index.js'
import { createCarousel, removeCarousels } from './fixture.js'

afterEach(removeCarousels)

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

test('keeps focus in an off-screen slide when the window loses focus', async () => {
  const { slides, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [emblaA11y({ label: 'Products', hideOffscreen: true })]
  })
  const link = slides[0]?.querySelector('a')
  link?.focus()
  const settled = new Promise((resolve) => emblaApi.on('settle', resolve))
  emblaApi.goTo(2)
  await settled

  link?.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }))
  await nextFrame()
  await nextFrame()

  expect(document.activeElement).toBe(link)
  expect(slides[0]?.hasAttribute('inert')).toBe(false)
})

test('hides an off-screen slide once focus really leaves it', async () => {
  const { slides, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [emblaA11y({ label: 'Products', hideOffscreen: true })]
  })
  const link = slides[0]?.querySelector('a')
  link?.focus()
  const settled = new Promise((resolve) => emblaApi.on('settle', resolve))
  emblaApi.goTo(2)
  await settled

  link?.blur()
  await nextFrame()
  await nextFrame()

  expect(document.activeElement).toBe(document.body)
  expect(slides[0]?.hasAttribute('inert')).toBe(true)
})

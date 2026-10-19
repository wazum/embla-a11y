import { afterEach, expect, test } from 'vitest'
import { page } from 'vitest/browser'
import emblaA11y from '../src/index.js'
import { createCarousel, removeCarousels } from './fixture.js'

afterEach(removeCarousels)

function inertSlides(slides: HTMLElement[]): HTMLElement[] {
  return slides.filter((slide) => slide.closest('[inert]') !== null)
}

test('does nothing when the plugin is switched off', () => {
  const { slides } = createCarousel({
    slideCount: 10,
    plugins: [emblaA11y({ label: 'Produkte', hideOffscreen: true, active: false })]
  })

  expect(page.getByRole('region').elements()).toHaveLength(0)
  expect(inertSlides(slides)).toEqual([])
})

test('does nothing when a breakpoint switches the plugin off', () => {
  const { slides } = createCarousel({
    slideCount: 10,
    plugins: [
      emblaA11y({
        label: 'Produkte',
        hideOffscreen: true,
        breakpoints: { '(min-width: 1px)': { active: false } }
      })
    ]
  })

  expect(page.getByRole('region').elements()).toHaveLength(0)
  expect(inertSlides(slides)).toEqual([])
})

test('takes everything back when a breakpoint switches the plugin off later', async () => {
  await page.viewport(600, 800)
  const { slides } = createCarousel({
    slideCount: 10,
    plugins: [
      emblaA11y({
        label: 'Produkte',
        hideOffscreen: true,
        breakpoints: { '(min-width: 900px)': { active: false } }
      })
    ]
  })
  expect(page.getByRole('region').elements()).toHaveLength(1)
  expect(inertSlides(slides)).not.toEqual([])

  await page.viewport(1200, 800)

  await expect.poll(() => page.getByRole('region').elements()).toHaveLength(0)
  await expect.poll(() => inertSlides(slides)).toEqual([])
})

test('does nothing when the carousel itself is switched off', () => {
  const { slides } = createCarousel({
    slideCount: 10,
    options: { active: false },
    plugins: [emblaA11y({ label: 'Produkte', hideOffscreen: true })]
  })

  expect(page.getByRole('region').elements()).toHaveLength(0)
  expect(inertSlides(slides)).toEqual([])
})

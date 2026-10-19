import { afterEach, expect, test } from 'vitest'
import emblaA11y from '../src/index.js'
import { createCarousel, removeCarousels } from './fixture.js'

afterEach(removeCarousels)

function positionsOf(slides: HTMLElement[]): (string | null)[][] {
  return slides.map((slide) => [
    slide.getAttribute('aria-posinset'),
    slide.getAttribute('aria-setsize')
  ])
}

test('keeps the full count on list items while off-screen slides are hidden', () => {
  const { slides } = createCarousel({
    slideCount: 10,
    list: true,
    plugins: [emblaA11y({ label: 'Produkte', hideOffscreen: true })]
  })

  expect(positionsOf(slides)).toEqual(slides.map((_, index) => [String(index + 1), '10']))
})

test('adds no list position to slides that are not list items', () => {
  const { slides } = createCarousel({
    slideCount: 10,
    plugins: [emblaA11y({ label: 'Produkte', hideOffscreen: true })]
  })

  expect(positionsOf(slides)).toEqual(slides.map(() => [null, null]))
})

test('adds no list position while every slide stays reachable', () => {
  const { slides } = createCarousel({
    slideCount: 10,
    list: true,
    plugins: [emblaA11y({ label: 'Produkte' })]
  })

  expect(positionsOf(slides)).toEqual(slides.map(() => [null, null]))
})

import { afterEach, expect, test, vi } from 'vitest'
import emblaA11y from '../src/index.js'
import { createCarousel, removeCarousels } from './fixture.js'

afterEach(() => {
  removeCarousels()
  vi.restoreAllMocks()
})

test('measures the viewport once per pass while hiding off-screen slides', () => {
  const { slides, emblaApi } = createCarousel({
    slideCount: 20,
    plugins: [emblaA11y({ label: 'Products' })]
  })
  const viewport = emblaApi.rootNode()
  const measure = vi.spyOn(Element.prototype, 'getBoundingClientRect')
  measure.mockClear()

  emblaApi.goTo(10, true)

  const viewportReads = measure.mock.contexts.filter((element) => element === viewport).length
  const slideReads = measure.mock.contexts.filter((element) =>
    slides.some((slide) => slide === element)
  ).length
  const passes = slideReads / slides.length
  expect(passes).toBeGreaterThanOrEqual(1)
  expect(viewportReads).toBe(passes)
})

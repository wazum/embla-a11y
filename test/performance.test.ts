import { afterEach, expect, test, vi } from 'vitest'
import emblaA11y from '../src/index.js'
import { createCarousel, removeCarousels } from './fixture.js'

afterEach(() => {
  removeCarousels()
  vi.restoreAllMocks()
})

test('ignores changes that cannot affect the focused element', async () => {
  const { slides, buttons } = createCarousel({
    plugins: ({ previous, next }) => [
      emblaA11y({ label: 'Products', previousButton: previous, nextButton: next })
    ]
  })
  const container = slides[0]?.parentElement
  if (container === null || container === undefined) throw new Error('container not found')
  buttons.next.focus()
  const check = vi.spyOn(Element.prototype, 'checkVisibility')

  for (let step = 1; step <= 10; step++) {
    container.style.transform = `translate3d(-${step}px, 0, 0)`
    await new Promise((resolve) => setTimeout(resolve))
  }

  expect(check).not.toHaveBeenCalled()
})

test('measures the viewport once per pass while hiding off-screen slides', async () => {
  const { slides, emblaApi } = createCarousel({
    slideCount: 20,
    plugins: [emblaA11y({ label: 'Products' })]
  })
  const viewport = emblaApi.rootNode()
  const measure = vi.spyOn(Element.prototype, 'getBoundingClientRect')
  measure.mockClear()

  emblaApi.goTo(10, true)
  await new Promise((resolve) => requestAnimationFrame(resolve))

  const viewportReads = measure.mock.contexts.filter((element) => element === viewport).length
  const slideReads = measure.mock.contexts.filter((element) =>
    slides.some((slide) => slide === element)
  ).length
  const passes = slideReads / slides.length
  expect(passes).toBeGreaterThanOrEqual(1)
  expect(viewportReads).toBe(passes)
})

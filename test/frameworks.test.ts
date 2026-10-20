import Autoplay from 'embla-carousel-autoplay'
import { afterEach, expect, test, vi } from 'vitest'
import emblaA11y from '../src/index.js'
import { createCarousel, removeCarousels } from './fixture.js'

afterEach(() => {
  removeCarousels()
  vi.restoreAllMocks()
})

function createButton(text: string, parent: HTMLElement): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = text
  parent.append(button)
  return button
}

test('keeps the rotation stopped when a framework swaps in a new plugin instance', async () => {
  const { slides, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [Autoplay({ delay: 1000 }), emblaA11y({ label: 'Products' })]
  })
  emblaApi.plugins().autoplay?.play()
  await new Promise((resolve) => setTimeout(resolve, 50))
  slides[0]?.querySelector('a')?.focus()
  await expect.poll(() => emblaApi.plugins().autoplay?.isPlaying()).toBe(false)

  emblaApi.reInit({}, [Autoplay({ delay: 1000 }), emblaA11y({ label: 'Products' })])
  emblaApi.plugins().autoplay?.play()
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(emblaApi.plugins().autoplay?.isPlaying()).toBe(false)
})

test('takes over buttons rendered later and gives the old ones their markup back', () => {
  const { wrapper, buttons, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: ({ previous, next }) => [
      emblaA11y({ label: 'Products', previousButton: previous, nextButton: next })
    ]
  })
  const previous = createButton('Previous', wrapper)
  const next = createButton('Next', wrapper)

  emblaApi.reInit({}, [
    emblaA11y({ label: 'Products', previousButton: previous, nextButton: next })
  ])

  expect(buttons.previous.hasAttribute('aria-disabled')).toBe(false)
  expect(previous.getAttribute('aria-disabled')).toBe('true')
})

test('does not repeat a warning when a framework swaps in a new plugin instance', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const { emblaApi } = createCarousel({ plugins: [emblaA11y()] })

  emblaApi.reInit({}, [emblaA11y()])

  expect(warn).toHaveBeenCalledOnce()
})

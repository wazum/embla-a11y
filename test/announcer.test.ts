import { afterEach, expect, test, vi } from 'vitest'
import emblaA11y from '../src/index.js'
import { createCarousel, removeCarousels } from './fixture.js'

afterEach(() => {
  removeCarousels()
  vi.restoreAllMocks()
})

function createAnnouncer(attributes: Record<string, string>): HTMLElement {
  const announcer = document.createElement('p')
  announcer.setAttribute('aria-live', 'polite')
  for (const [name, value] of Object.entries(attributes)) announcer.setAttribute(name, value)
  document.body.append(announcer)
  return announcer
}

test('leaves the announcer as it was on destroy', async () => {
  const announcer = createAnnouncer({ 'data-announcement': 'Folie {first} von {total}' })
  const { buttons, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: ({ previous, next }) => [
      emblaA11y({ label: 'Produkte', previousButton: previous, nextButton: next, announcer })
    ]
  })
  buttons.next.addEventListener('click', () => emblaApi.goToNext(true))
  buttons.next.click()
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(announcer.textContent).toBe('Folie 2 von 3')

  emblaApi.destroy()

  expect(announcer.textContent).toBe('')
})

test('announces nothing after destroy, even when a move was just made', async () => {
  const announcer = createAnnouncer({ 'data-announcement': 'Folie {first} von {total}' })
  const { buttons, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: ({ previous, next }) => [
      emblaA11y({ label: 'Produkte', previousButton: previous, nextButton: next, announcer })
    ]
  })
  buttons.next.addEventListener('click', () => emblaApi.goToNext(true))

  buttons.next.click()
  emblaApi.destroy()
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(announcer.textContent).toBe('')
})

test('warns when the announcer has no text', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const announcer = createAnnouncer({})

  createCarousel({ plugins: [emblaA11y({ label: 'Produkte', announcer })] })

  expect(warn).toHaveBeenCalledOnce()
})

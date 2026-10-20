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
      emblaA11y({ label: 'Products', previousButton: previous, nextButton: next, announcer })
    ]
  })
  buttons.next.addEventListener('click', () => emblaApi.goToNext(true))
  buttons.next.click()
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(announcer.textContent).toBe('Folie 2 von 3')

  emblaApi.destroy()

  expect(announcer.textContent).toBe('')
})

test('gives back the markup that was in the announcer on destroy', async () => {
  const announcer = createAnnouncer({ 'data-announcement': 'Folie {first} von {total}' })
  const original = document.createElement('span')
  original.textContent = 'Products'
  announcer.append(original)
  const { buttons, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: ({ previous, next }) => [
      emblaA11y({ label: 'Products', previousButton: previous, nextButton: next, announcer })
    ]
  })
  buttons.next.addEventListener('click', () => emblaApi.goToNext(true))
  buttons.next.click()
  await new Promise((resolve) => setTimeout(resolve, 50))

  emblaApi.destroy()

  expect(Array.from(announcer.childNodes)).toEqual([original])
})

test('announces nothing after destroy, even when a move was just made', async () => {
  const announcer = createAnnouncer({ 'data-announcement': 'Folie {first} von {total}' })
  const { buttons, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: ({ previous, next }) => [
      emblaA11y({ label: 'Products', previousButton: previous, nextButton: next, announcer })
    ]
  })
  buttons.next.addEventListener('click', () => emblaApi.goToNext(true))

  buttons.next.click()
  emblaApi.destroy()
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(announcer.textContent).toBe('')
})

test('stays silent on automatic moves after a cancelled touch', async () => {
  const announcer = createAnnouncer({ 'data-announcement': 'Folie {first} von {total}' })
  const { emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [emblaA11y({ label: 'Products', announcer })]
  })
  emblaApi.rootNode().dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  window.dispatchEvent(new PointerEvent('pointercancel'))
  await new Promise((resolve) => setTimeout(resolve, 50))

  emblaApi.goToNext(true)
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(announcer.textContent).toBe('')
})

test('warns when the announcer has no text', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const announcer = createAnnouncer({})

  createCarousel({ plugins: [emblaA11y({ label: 'Products', announcer })] })

  expect(warn).toHaveBeenCalledOnce()
})

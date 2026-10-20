import { afterEach, expect, test, vi } from 'vitest'
import emblaA11y, { type AnnouncementType } from '../src/index.js'
import { createCarousel, removeCarousels, stageControl } from './fixture.js'

afterEach(() => {
  removeCarousels()
  vi.restoreAllMocks()
})

function createAnnouncer(attributes: Record<string, string>): HTMLElement {
  const announcer = document.createElement('p')
  announcer.setAttribute('aria-live', 'polite')
  for (const [name, value] of Object.entries(attributes)) announcer.setAttribute(name, value)
  return stageControl(announcer)
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
  await expect.poll(() => announcer.textContent).toBe('Folie 2 von 3')

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

test('announces the text from announcement when the markup has no template', async () => {
  const announcer = createAnnouncer({})
  const { buttons, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: ({ previous, next }) => [
      emblaA11y({
        label: 'Products',
        previousButton: previous,
        nextButton: next,
        announcer,
        announcement: (first, last, total) => `Folien ${first} bis ${last} von ${total}`
      })
    ]
  })
  buttons.next.addEventListener('click', () => emblaApi.goToNext(true))

  buttons.next.click()

  await expect.poll(() => announcer.textContent).toBe('Folien 2 bis 2 von 3')
})

test('prefers the template from the markup over announcement', async () => {
  const announcer = createAnnouncer({ 'data-announcement': 'Folie {first} von {total}' })
  const { buttons, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: ({ previous, next }) => [
      emblaA11y({
        label: 'Products',
        previousButton: previous,
        nextButton: next,
        announcer,
        announcement: () => 'Ignoriert'
      })
    ]
  })
  buttons.next.addEventListener('click', () => emblaApi.goToNext(true))

  buttons.next.click()

  await expect.poll(() => announcer.textContent).toBe('Folie 2 von 3')
})

test('fills in the page and the number of pages', async () => {
  const announcer = createAnnouncer({ 'data-announcement-group': 'Seite {page} von {pages}' })
  const { buttons, emblaApi } = createCarousel({
    slideCount: 6,
    slideWidth: '50%',
    options: { slidesToScroll: 'auto' },
    plugins: ({ previous, next }) => [
      emblaA11y({ label: 'Products', previousButton: previous, nextButton: next, announcer })
    ]
  })
  buttons.next.addEventListener('click', () => emblaApi.goToNext(true))

  buttons.next.click()

  await expect.poll(() => announcer.textContent).toBe('Seite 2 von 3')
})

test('passes the page and the number of pages to announcement', async () => {
  const announcement = vi.fn<AnnouncementType>((first, last) => `${first}-${last}`)
  const announcer = createAnnouncer({})
  const { buttons, emblaApi } = createCarousel({
    slideCount: 6,
    slideWidth: '50%',
    options: { slidesToScroll: 'auto' },
    plugins: ({ previous, next }) => [
      emblaA11y({
        label: 'Products',
        previousButton: previous,
        nextButton: next,
        announcer,
        announcement
      })
    ]
  })
  buttons.next.addEventListener('click', () => emblaApi.goToNext(true))

  buttons.next.click()

  await expect.poll(() => announcement.mock.lastCall).toEqual([3, 4, 6, 2, 3])
})

test('warns when the announcer has no text', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const announcer = createAnnouncer({})

  createCarousel({ plugins: [emblaA11y({ label: 'Products', announcer })] })

  expect(warn).toHaveBeenCalledOnce()
})

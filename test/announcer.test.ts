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

test('warns when several slides on screen are announced with the template for one', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const announcer = createAnnouncer({ 'data-announcement': 'Folie {first} von {total}' })
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

  await expect.poll(() => announcer.textContent).toBe('Folie 3 von 6')
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('data-announcement-group'))
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

  await expect.poll(() => announcement.mock.lastCall).toEqual([3, 4, 6, 2, 3, [3, 4], ['', '']])
})

function createLoopAtSeam(announcer: HTMLElement, announcement?: AnnouncementType) {
  const { buttons, emblaApi } = createCarousel({
    slideCount: 10,
    slideWidth: '33.333%',
    options: { loop: true, align: 'start' },
    wrapperAttributes: { lang: 'de' },
    plugins: ({ previous, next }) => [
      emblaA11y({
        label: 'Products',
        previousButton: previous,
        nextButton: next,
        announcer,
        ...(announcement === undefined ? {} : { announcement })
      })
    ]
  })
  buttons.previous.addEventListener('click', () => emblaApi.goToPrev(true))
  buttons.previous.click()
}

test('lists the slides in the page language where a loop wraps around', async () => {
  const announcer = createAnnouncer({
    'data-announcement-group': 'Folien {first} bis {last} von {total}',
    'data-announcement-wrapped': 'Folien {slides} von {total}'
  })

  createLoopAtSeam(announcer)

  await expect.poll(() => announcer.textContent).toBe('Folien 10, 1 und 2 von 10')
})

test('warns where a loop wraps around and the announcer has no template for it', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const announcer = createAnnouncer({
    'data-announcement-group': 'Folien {first} bis {last} von {total}'
  })

  createLoopAtSeam(announcer)

  await expect.poll(() => announcer.textContent).toBe('Folien 10 bis 2 von 10')
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('data-announcement-wrapped'))
})

test('passes the slides on screen to announcement', async () => {
  const announcement = vi.fn<AnnouncementType>(() => 'Folien')
  const announcer = createAnnouncer({})

  createLoopAtSeam(announcer, announcement)

  await expect.poll(() => announcement.mock.lastCall?.[5]).toEqual([10, 1, 2])
})

function createCarouselWithHeadings(announcer: HTMLElement, announcement?: AnnouncementType) {
  const carousel = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: ({ previous, next }) => [
      emblaA11y({
        label: 'Products',
        previousButton: previous,
        nextButton: next,
        announcer,
        ...(announcement === undefined ? {} : { announcement })
      })
    ]
  })
  carousel.slides.forEach((slide, index) => {
    if (index === 2) return
    const heading = document.createElement('h3')
    heading.textContent = `  Produkt   ${index + 1} `
    slide.prepend(heading)
  })
  carousel.buttons.next.addEventListener('click', () => carousel.emblaApi.goToNext(true))
  return carousel
}

test('fills in the heading of the first slide on screen', async () => {
  const announcer = createAnnouncer({
    'data-announcement': 'Folie {first} von {total}: {heading}'
  })
  const { buttons } = createCarouselWithHeadings(announcer)

  buttons.next.click()

  await expect.poll(() => announcer.textContent).toBe('Folie 2 von 3: Produkt 2')
})

test('passes the headings of the slides on screen to announcement', async () => {
  const announcement = vi.fn<AnnouncementType>(() => 'Folie')
  const announcer = createAnnouncer({})
  const { buttons } = createCarouselWithHeadings(announcer, announcement)

  buttons.next.click()
  await expect.poll(() => announcement.mock.lastCall?.[6]).toEqual(['Produkt 2'])

  buttons.next.click()
  await expect.poll(() => announcement.mock.lastCall?.[6]).toEqual([''])
})

test('announces a move a framework makes a moment after the click', async () => {
  const announcer = createAnnouncer({ 'data-announcement': 'Folie {first} von {total}' })
  const { buttons, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: ({ previous, next }) => [
      emblaA11y({ label: 'Products', previousButton: previous, nextButton: next, announcer })
    ]
  })
  buttons.next.addEventListener('click', () => {
    setTimeout(() => emblaApi.goToNext(true), 100)
  })

  buttons.next.click()

  await expect.poll(() => announcer.textContent).toBe('Folie 2 von 3')
})

test('stays silent for a move long after a click', async () => {
  const announcer = createAnnouncer({ 'data-announcement': 'Folie {first} von {total}' })
  const { buttons, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: ({ previous, next }) => [
      emblaA11y({ label: 'Products', previousButton: previous, nextButton: next, announcer })
    ]
  })

  buttons.next.click()
  await new Promise((resolve) => setTimeout(resolve, 1500))
  emblaApi.goToNext(true)
  await new Promise((resolve) => setTimeout(resolve, 100))

  expect(announcer.textContent).toBe('')
})

function recordTexts(announcer: HTMLElement): string[] {
  const texts: string[] = []
  new MutationObserver(() => texts.push(announcer.textContent)).observe(announcer, {
    childList: true,
    characterData: true,
    subtree: true
  })
  return texts
}

test('announces a move exactly once', async () => {
  const announcer = createAnnouncer({ 'data-announcement': 'Folie {first} von {total}' })
  const { buttons, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: ({ previous, next }) => [
      emblaA11y({ label: 'Products', previousButton: previous, nextButton: next, announcer })
    ]
  })
  buttons.next.addEventListener('click', () => emblaApi.goToNext())
  const texts = recordTexts(announcer)

  buttons.next.click()
  await expect.poll(() => announcer.textContent, { timeout: 3000 }).toBe('Folie 2 von 3')
  await new Promise((resolve) => setTimeout(resolve, 300))

  expect(texts).toEqual(['Folie 2 von 3'])
})

test('clears and rewrites identical text, so it is read again', async () => {
  const announcer = createAnnouncer({ 'data-announcement': 'Folie gewechselt' })
  const { buttons, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: ({ previous, next }) => [
      emblaA11y({ label: 'Products', previousButton: previous, nextButton: next, announcer })
    ]
  })
  buttons.next.addEventListener('click', () => emblaApi.goToNext(true))
  const texts = recordTexts(announcer)

  buttons.next.click()
  await expect.poll(() => texts).toEqual(['Folie gewechselt'])
  buttons.next.click()

  await expect.poll(() => texts).toEqual(['Folie gewechselt', '', 'Folie gewechselt'])
})

test('uses the group template for one slide when there is no other', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const announcer = createAnnouncer({
    'data-announcement-group': 'Folien {first} bis {last} von {total}'
  })
  const { buttons, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: ({ previous, next }) => [
      emblaA11y({ label: 'Products', previousButton: previous, nextButton: next, announcer })
    ]
  })
  buttons.next.addEventListener('click', () => emblaApi.goToNext(true))

  buttons.next.click()

  await expect.poll(() => announcer.textContent).toBe('Folien 2 bis 2 von 3')
  expect(warn).not.toHaveBeenCalled()
})

test('warns when the announcer has no text', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const announcer = createAnnouncer({})

  createCarousel({ plugins: [emblaA11y({ label: 'Products', announcer })] })

  expect(warn).toHaveBeenCalledOnce()
})

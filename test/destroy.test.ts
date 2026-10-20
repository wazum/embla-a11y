import EmblaCarousel from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'
import { afterEach, expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { asEmblaV9 } from '../src/compat/emblaV8.js'
import emblaA11y from '../src/index.js'
import { attributesOf, createCarousel, removeCarousels } from './fixture.js'

afterEach(removeCarousels)

test('leaves the page exactly as it was after destroy, with every feature in use', async () => {
  const {
    slides,
    buttons,
    emblaApi: withoutPlugin
  } = createCarousel({
    slideCount: 6,
    slideWidth: '50%',
    list: true,
    dotTexts: ['', '', ''],
    dotsAttributes: { 'data-dot-label': 'Slide {first}' }
  })
  buttons.dots.children[0]?.setAttribute('aria-current', 'page')
  const announcer = document.createElement('p')
  announcer.setAttribute('data-announcement-group', 'Slides {first} to {last} of {total}')
  const rotationButton = document.createElement('button')
  rotationButton.innerHTML =
    '<span data-rotation-playing>Stop</span><span data-rotation-stopped hidden>Start</span>'
  document.body.append(announcer, rotationButton)
  withoutPlugin.destroy()
  const viewport = slides[0]?.parentElement?.parentElement
  if (viewport === null || viewport === undefined) throw new Error('viewport not found')
  const before = document.body.innerHTML

  const emblaApi = asEmblaV9(
    EmblaCarousel(viewport, {}, [
      Autoplay({ delay: 1000 }),
      emblaA11y({
        label: 'Products',
        previousButton: buttons.previous,
        nextButton: buttons.next,
        dots: buttons.dots,
        announcer,
        rotationButton,
        hideOffscreen: true
      })
    ])
  )
  emblaApi.plugins().autoplay?.play()
  buttons.next.addEventListener('click', () => emblaApi.goToNext(true))
  buttons.next.click()
  await new Promise((resolve) => setTimeout(resolve, 100))
  expect(document.body.innerHTML).not.toBe(before)

  emblaApi.destroy()

  expect(document.body.innerHTML).toBe(before)
})

test('stops following focus after destroy', () => {
  const { slides, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [emblaA11y({ label: 'Products', hideOffscreen: false })]
  })
  const viewport = emblaApi.rootNode()
  const link = slides[0]?.querySelector('a')
  if (link === null || link === undefined) throw new Error('link not found')
  link.style.marginLeft = '200px'
  emblaApi.destroy()
  viewport.scrollLeft = 40
  const scrolled = viewport.scrollLeft

  link.focus()

  expect(scrolled).toBeGreaterThan(0)
  expect(viewport.scrollLeft).toBe(scrolled)
})

test('leaves the rotation button alone after destroy', async () => {
  const rotationButton = document.createElement('button')
  rotationButton.innerHTML =
    '<span data-rotation-playing>Stop</span><span data-rotation-stopped hidden>Start</span>'
  const { wrapper, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: ({ previous, next }) => [
      Autoplay({ delay: 1000 }),
      emblaA11y({ label: 'Products', previousButton: previous, nextButton: next, rotationButton })
    ]
  })
  wrapper.append(rotationButton)
  emblaApi.plugins().autoplay?.play()
  await new Promise((resolve) => setTimeout(resolve, 50))
  emblaApi.destroy()
  const before = rotationButton.innerHTML

  rotationButton.click()
  wrapper.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(rotationButton.innerHTML).toBe(before)
})

test('keeps a second carousel working when the first is destroyed', async () => {
  const first = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: ({ previous, next }) => [
      emblaA11y({ label: 'Products', previousButton: previous, nextButton: next })
    ]
  })
  const second = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: ({ previous, next }) => [
      emblaA11y({
        label: 'News',
        previousButton: previous,
        nextButton: next,
        hideOffscreen: false
      })
    ]
  })

  first.emblaApi.destroy()

  expect(page.getByRole('region').elements()).toEqual([second.wrapper])
  second.slides[2]?.querySelector('a')?.focus()
  await expect.poll(() => second.emblaApi.selectedSnap()).toBe(2)
  await expect.poll(() => second.buttons.next.getAttribute('aria-disabled')).toBe('true')
})

test('restores the original markup on destroy', () => {
  const { wrapper, emblaApi } = createCarousel({
    plugins: [emblaA11y({ label: 'Featured products' })],
    wrapperAttributes: { class: 'embla', 'data-carousel': 'products' }
  })

  emblaApi.destroy()

  expect(attributesOf(wrapper)).toEqual({ class: 'embla', 'data-carousel': 'products' })
})

test('restores the previous and next buttons on destroy', () => {
  const { buttons, emblaApi } = createCarousel({
    plugins: ({ previous, next }) => [
      emblaA11y({ label: 'Featured products', previousButton: previous, nextButton: next })
    ]
  })

  emblaApi.destroy()

  expect(attributesOf(buttons.previous)).toEqual({ type: 'button' })
  expect(attributesOf(buttons.next)).toEqual({ type: 'button' })
})

test('rescues focus that was already inside the carousel when the plugin started', async () => {
  const { buttons, emblaApi } = createCarousel()
  buttons.next.focus()

  emblaApi.reInit({}, [
    emblaA11y({
      label: 'Featured products',
      previousButton: buttons.previous,
      nextButton: buttons.next
    })
  ])
  buttons.next.disabled = true
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(document.activeElement).toBe(buttons.previous)
})

test('stops moving focus after destroy', async () => {
  const { buttons, emblaApi } = createCarousel({
    plugins: ({ previous, next }) => [
      emblaA11y({ label: 'Featured products', previousButton: previous, nextButton: next })
    ]
  })
  buttons.next.focus()

  emblaApi.destroy()
  buttons.next.disabled = true
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(document.activeElement).not.toBe(buttons.previous)
})

test('makes hidden slides reachable again on destroy', () => {
  const { slides, emblaApi } = createCarousel({
    slideCount: 10,
    plugins: [emblaA11y({ label: 'Featured products', hideOffscreen: true })]
  })
  const lastLink = slides[9]?.querySelector('a')

  emblaApi.destroy()
  lastLink?.focus()

  expect(document.activeElement).toBe(lastLink)
})

test('keeps the region through reInit and removes it on destroy', async () => {
  const { emblaApi } = createCarousel({ plugins: [emblaA11y({ label: 'Featured products' })] })

  emblaApi.reInit()
  emblaApi.reInit()

  await expect.element(page.getByRole('region', { name: 'Featured products' })).toBeVisible()

  emblaApi.destroy()

  expect(page.getByRole('region').elements()).toHaveLength(0)
})

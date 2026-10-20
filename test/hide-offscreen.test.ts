import AutoScroll from 'embla-carousel-auto-scroll'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import emblaA11y from '../src/index.js'
import { createCarousel, removeCarousels } from './fixture.js'

afterEach(removeCarousels)

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

test('hides slides that are fully off-screen by default', () => {
  const { slides } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [emblaA11y({ label: 'Products' })]
  })

  expect(slides.map((slide) => slide.hasAttribute('inert'))).toEqual([false, true, true])
})

test('keeps hiding slides that leave the screen while AutoScroll runs', async () => {
  const { slides, emblaApi } = createCarousel({
    slideCount: 6,
    slideWidth: '50%',
    options: { loop: true },
    plugins: ({ previous, next }) => [
      AutoScroll({ speed: 30, startDelay: 0 }),
      emblaA11y({ label: 'Products', previousButton: previous, nextButton: next })
    ]
  })
  const outside = document.createElement('p')
  outside.textContent = 'Outside'
  document.body.prepend(outside)
  await userEvent.hover(outside)
  const outOfStep: string[] = []
  let offScreenSeen = 0
  emblaApi.on('scroll', () => {
    const viewport = emblaApi.rootNode().getBoundingClientRect()
    slides.forEach((slide, index) => {
      const rect = slide.getBoundingClientRect()
      const offScreen = rect.right < viewport.left + 1 || rect.left > viewport.right - 1
      if (offScreen) offScreenSeen++
      if (offScreen !== slide.hasAttribute('inert')) outOfStep.push(`slide ${index + 1}`)
    })
  })
  emblaApi.plugins().autoScroll?.play()
  await new Promise((resolve) => setTimeout(resolve, 1500))

  expect(emblaApi.plugins().autoScroll?.isPlaying()).toBe(true)
  expect(offScreenSeen).toBeGreaterThan(0)
  expect(outOfStep).toEqual([])
})

test('keeps every slide reachable with hideOffscreen: false', () => {
  const { slides } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [emblaA11y({ label: 'Products', hideOffscreen: false })]
  })

  expect(slides.map((slide) => slide.hasAttribute('inert'))).toEqual([false, false, false])
})

test('keeps focus in an off-screen slide when the window loses focus', async () => {
  const { slides, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [emblaA11y({ label: 'Products', hideOffscreen: true })]
  })
  const link = slides[0]?.querySelector('a')
  link?.focus()
  const settled = new Promise((resolve) => emblaApi.on('settle', resolve))
  emblaApi.goTo(2)
  await settled

  link?.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }))
  await nextFrame()
  await nextFrame()

  expect(document.activeElement).toBe(link)
  expect(slides[0]?.hasAttribute('inert')).toBe(false)
})

test('hides an off-screen slide once focus really leaves it', async () => {
  const { slides, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [emblaA11y({ label: 'Products', hideOffscreen: true })]
  })
  const link = slides[0]?.querySelector('a')
  link?.focus()
  const settled = new Promise((resolve) => emblaApi.on('settle', resolve))
  emblaApi.goTo(2)
  await settled

  link?.blur()
  await nextFrame()
  await nextFrame()

  expect(document.activeElement).toBe(document.body)
  expect(slides[0]?.hasAttribute('inert')).toBe(true)
})

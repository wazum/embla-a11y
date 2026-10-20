import { afterEach, expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import emblaA11y from '../src/index.js'
import { createCarousel, removeCarousels } from './fixture.js'

afterEach(() => {
  removeCarousels()
  vi.restoreAllMocks()
})

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
    plugins: [emblaA11y({ label: 'Products', hideOffscreen: true })]
  })

  expect(positionsOf(slides)).toEqual(slides.map((_, index) => [String(index + 1), '10']))
})

test('makes div slides a list with the full count, and takes the roles back on destroy', async () => {
  const { slides, emblaApi } = createCarousel({
    slideCount: 10,
    plugins: [emblaA11y({ label: 'Products' })]
  })
  const container = slides[0]?.parentElement

  await expect.element(page.getByRole('list')).toBeInTheDocument()
  expect(slides.map((slide) => slide.getAttribute('role'))).toEqual(slides.map(() => 'listitem'))
  expect(positionsOf(slides)).toEqual(slides.map((_, index) => [String(index + 1), '10']))

  emblaApi.destroy()

  expect(container?.hasAttribute('role')).toBe(false)
  expect(slides.map((slide) => slide.hasAttribute('role'))).toEqual(slides.map(() => false))
})

test('keeps the roles the author gave the slides', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const { slides } = createCarousel({
    slideAttributes: { role: 'group', 'aria-roledescription': 'Folie' },
    plugins: [emblaA11y({ label: 'Products' })]
  })

  expect(slides[0]?.parentElement?.hasAttribute('role')).toBe(false)
  expect(slides.map((slide) => slide.getAttribute('role'))).toEqual(slides.map(() => 'group'))
  expect(warn).not.toHaveBeenCalled()
})

test('warns and adds no list position when the slides cannot become a list', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const { slides } = createCarousel({
    slideCount: 10,
    slideTag: 'article',
    plugins: [emblaA11y({ label: 'Products' })]
  })

  expect(positionsOf(slides)).toEqual(slides.map(() => [null, null]))
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('the slides are not a list'))
})

test('adds no list position while every slide stays reachable', () => {
  const { slides } = createCarousel({
    slideCount: 10,
    list: true,
    plugins: [emblaA11y({ label: 'Products', hideOffscreen: false })]
  })

  expect(positionsOf(slides)).toEqual(slides.map(() => [null, null]))
})

import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import emblaA11y from '../src/index.js'
import { attributesOf, createCarousel, removeCarousels } from './fixture.js'

afterEach(removeCarousels)

function createCarouselWithDots({ dotKeys = true, dir }: { dotKeys?: boolean; dir?: string } = {}) {
  const carousel = createCarousel({
    slideCount: 4,
    slideWidth: '100%',
    dotTexts: ['', '', '', ''],
    dotsAttributes: { 'data-dot-label': 'Slide {first}', ...(dir === undefined ? {} : { dir }) },
    plugins: ({ dots }) => [emblaA11y({ label: 'Products', dots, dotKeys })]
  })
  const dots = Array.from(carousel.buttons.dots.querySelectorAll('button'))
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => carousel.emblaApi.goTo(index, true))
  })
  return { ...carousel, dots }
}

function tabIndexes(dots: HTMLButtonElement[]): (string | null)[] {
  return dots.map((dot) => dot.getAttribute('tabindex'))
}

test('keeps only the current dot in the Tab order, and the dots plain buttons', () => {
  const { dots } = createCarouselWithDots()

  expect(tabIndexes(dots)).toEqual([null, '-1', '-1', '-1'])
  expect(dots[0]?.getAttribute('aria-current')).toBe('true')
  expect(dots.map((dot) => dot.hasAttribute('role'))).toEqual([false, false, false, false])
})

test('moves the Tab stop with the current dot', async () => {
  const { dots, emblaApi } = createCarouselWithDots()

  emblaApi.goTo(2, true)

  await expect.poll(() => tabIndexes(dots)).toEqual(['-1', '-1', null, '-1'])
})

test('marks the next dot current before it gets focus, so screen readers read it as current', async () => {
  const { dots } = createCarouselWithDots()
  const currentOnFocus: (string | null | undefined)[] = []
  dots[1]?.addEventListener('focus', () =>
    currentOnFocus.push(dots[1]?.getAttribute('aria-current'))
  )
  dots[0]?.focus()

  await userEvent.keyboard('{ArrowRight}')

  expect(currentOnFocus).toEqual(['true'])
})

test('moves to the next dot and shows its slide with the arrow keys, wrapping at the ends', async () => {
  const { dots } = createCarouselWithDots()
  dots[0]?.focus()

  await userEvent.keyboard('{ArrowRight}')

  expect(document.activeElement).toBe(dots[1])
  await expect.poll(() => dots[1]?.getAttribute('aria-current')).toBe('true')

  await userEvent.keyboard('{ArrowLeft}')
  await userEvent.keyboard('{ArrowLeft}')

  expect(document.activeElement).toBe(dots[3])
  await expect.poll(() => dots[3]?.getAttribute('aria-current')).toBe('true')
})

test('jumps to the first and the last dot with Home and End', async () => {
  const { dots } = createCarouselWithDots()
  dots[0]?.focus()

  await userEvent.keyboard('{End}')

  expect(document.activeElement).toBe(dots[3])
  await expect.poll(() => dots[3]?.getAttribute('aria-current')).toBe('true')

  await userEvent.keyboard('{Home}')

  expect(document.activeElement).toBe(dots[0])
})

test('swaps the arrow keys for right-to-left text', async () => {
  const { dots } = createCarouselWithDots({ dir: 'rtl' })
  dots[0]?.focus()

  await userEvent.keyboard('{ArrowLeft}')

  expect(document.activeElement).toBe(dots[1])
})

test('keeps every dot in the Tab order without dotKeys', async () => {
  const { dots } = createCarouselWithDots({ dotKeys: false })
  dots[0]?.focus()

  await userEvent.keyboard('{ArrowRight}')

  expect(tabIndexes(dots)).toEqual([null, null, null, null])
  expect(document.activeElement).toBe(dots[0])
})

test('gives the dots their markup back on destroy', () => {
  const { dots, emblaApi } = createCarouselWithDots()

  emblaApi.destroy()

  expect(dots.map((dot) => attributesOf(dot))).toEqual(dots.map(() => ({ type: 'button' })))
})

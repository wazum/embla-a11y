import Autoplay from 'embla-carousel-autoplay'
import { afterEach, expect, test, vi } from 'vitest'
import emblaA11y from '../src/index.js'
import { createCarousel, removeCarousels, stageControl } from './fixture.js'

afterEach(() => {
  removeCarousels()
  vi.restoreAllMocks()
})

function createElement(tag: string, text: string): HTMLElement {
  const element = document.createElement(tag)
  element.textContent = text
  return stageControl(element)
}

const setups = [
  { warning: 'the carousel has no name', create: () => createCarousel({ plugins: [emblaA11y()] }) },
  {
    warning: 'no element around the viewport',
    create: () => createCarousel({ wrapperTag: null, plugins: [emblaA11y({ label: 'Products' })] })
  },
  {
    warning: 'the slides are not a list',
    create: () =>
      createCarousel({ slideTag: 'article', plugins: [emblaA11y({ label: 'Products' })] })
  },
  {
    warning: 'a dot button has no name',
    create: () =>
      createCarousel({
        dotTexts: [''],
        plugins: ({ dots }) => [emblaA11y({ label: 'Products', dots })]
      })
  },
  {
    warning: 'the announcer has no text',
    create: () =>
      createCarousel({
        plugins: [emblaA11y({ label: 'Products', announcer: createElement('p', '') })]
      })
  },
  {
    warning: 'the rotation button has no texts',
    create: () =>
      createCarousel({
        plugins: [
          Autoplay(),
          emblaA11y({ label: 'Products', rotationButton: createElement('button', 'Pause') })
        ]
      })
  },
  {
    warning: 'no Autoplay or AutoScroll plugin',
    create: () =>
      createCarousel({
        plugins: [
          emblaA11y({
            label: 'Products',
            rotationButton: createElement('button', '')
          })
        ]
      })
  },
  {
    warning: 'without a rotation button',
    create: () => createCarousel({ plugins: [Autoplay(), emblaA11y({ label: 'Products' })] })
  }
]

test.each(setups)('warns once that $warning, also after a reInit', async ({ warning, create }) => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const { emblaApi } = create()
  await new Promise((resolve) => setTimeout(resolve, 50))

  emblaApi.reInit()
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(warn.mock.calls.filter(([message]) => String(message).includes(warning))).toHaveLength(1)
})

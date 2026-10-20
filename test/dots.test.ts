import { afterEach, expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import emblaA11y from '../src/index.js'
import { attributesOf, createCarousel, removeCarousels } from './fixture.js'

afterEach(() => {
  removeCarousels()
  vi.restoreAllMocks()
})

const germanTemplate = {
  'data-dot-label': 'Folie {first}',
  'data-dot-label-group': 'Folien {first} bis {last}'
}

test('names dots with the template from the markup', async () => {
  createCarousel({
    slideCount: 4,
    slideWidth: '50%',
    options: { slidesToScroll: 2 },
    dotTexts: ['', ''],
    dotsAttributes: germanTemplate,
    plugins: ({ dots }) => [emblaA11y({ label: 'Products', dots })]
  })

  await expect.element(page.getByRole('button', { name: 'Folien 1 bis 2' })).toBeVisible()
  await expect.element(page.getByRole('button', { name: 'Folien 3 bis 4' })).toBeVisible()
})

test('names dots with dotLabel when the markup has no template', async () => {
  createCarousel({
    slideCount: 4,
    slideWidth: '50%',
    options: { slidesToScroll: 2 },
    dotTexts: ['', ''],
    plugins: ({ dots }) => [
      emblaA11y({
        label: 'Products',
        dots,
        dotLabel: (first, last) => `Folien ${first} bis ${last}`
      })
    ]
  })

  await expect.element(page.getByRole('button', { name: 'Folien 1 bis 2' })).toBeVisible()
  await expect.element(page.getByRole('button', { name: 'Folien 3 bis 4' })).toBeVisible()
})

test('prefers the template from the markup over dotLabel', async () => {
  createCarousel({
    slideCount: 4,
    slideWidth: '50%',
    options: { slidesToScroll: 2 },
    dotTexts: ['', ''],
    dotsAttributes: germanTemplate,
    plugins: ({ dots }) => [emblaA11y({ label: 'Products', dots, dotLabel: () => 'Ignoriert' })]
  })

  await expect.element(page.getByRole('button', { name: 'Folien 1 bis 2' })).toBeVisible()
})

test('names no dot and warns when there is no text, template or option', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const { buttons } = createCarousel({
    slideCount: 2,
    slideWidth: '100%',
    dotTexts: ['', ''],
    plugins: ({ dots }) => [emblaA11y({ label: 'Products', dots })]
  })

  expect(buttons.dots.textContent).toBe('')
  expect(warn).toHaveBeenCalledOnce()
})

test('keeps the visible text of a dot as its name', async () => {
  createCarousel({
    slideCount: 2,
    slideWidth: '100%',
    dotTexts: ['Summer collection', 'Winter collection'],
    plugins: ({ dots }) => [emblaA11y({ label: 'Featured products', dots })]
  })

  await expect.element(page.getByRole('button', { name: 'Summer collection' })).toBeVisible()
})

test('names dots that show only a hidden icon', async () => {
  createCarousel({
    slideCount: 2,
    slideWidth: '100%',
    dotTexts: ['', ''],
    dotsAttributes: germanTemplate,
    plugins: ({ dots }) => {
      for (const dot of dots.querySelectorAll('button')) {
        dot.innerHTML = '<span aria-hidden="true">●</span>'
      }
      return [emblaA11y({ label: 'Products', dots })]
    }
  })

  await expect.element(page.getByRole('button', { name: 'Folie 1' })).toBeVisible()
  await expect.element(page.getByRole('button', { name: 'Folie 2' })).toBeVisible()
})

test('marks only the dot of the shown slide as current, whatever the markup said', () => {
  const { buttons } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    dotTexts: ['', '', ''],
    dotsAttributes: germanTemplate,
    plugins: ({ dots }) => {
      dots.children[1]?.setAttribute('aria-current', 'true')
      return [emblaA11y({ label: 'Featured products', dots })]
    }
  })

  const current = Array.from(buttons.dots.children, (dot) => dot.getAttribute('aria-current'))
  expect(current).toEqual(['true', null, null])
})

test('gives up its own name when the dot gets visible text later', async () => {
  const { buttons, emblaApi } = createCarousel({
    slideCount: 2,
    slideWidth: '100%',
    dotTexts: ['', ''],
    dotsAttributes: germanTemplate,
    plugins: ({ dots }) => [emblaA11y({ label: 'Featured products', dots })]
  })
  const firstDot = buttons.dots.children[0]
  if (firstDot === undefined) throw new Error('No dot')

  firstDot.textContent = 'Summer collection'
  emblaApi.goTo(1, true)

  await expect.element(page.getByRole('button', { name: 'Summer collection' })).toBeVisible()
})

test('keeps a label the author sets later', async () => {
  const { buttons, emblaApi } = createCarousel({
    slideCount: 2,
    slideWidth: '100%',
    dotTexts: ['', ''],
    dotsAttributes: germanTemplate,
    plugins: ({ dots }) => [emblaA11y({ label: 'Featured products', dots })]
  })

  buttons.dots.children[0]?.setAttribute('aria-label', 'Summer collection')
  emblaApi.goTo(1, true)

  await expect.element(page.getByRole('button', { name: 'Summer collection' })).toBeVisible()
})

test('names dots rebuilt inside list items', async () => {
  const { buttons } = createCarousel({
    slideCount: 2,
    slideWidth: '100%',
    dotsAttributes: germanTemplate,
    plugins: ({ dots }) => {
      const list = document.createElement('ul')
      list.append(
        ...['', ''].map(() => {
          const item = document.createElement('li')
          const dot = document.createElement('button')
          dot.type = 'button'
          item.append(dot)
          return item
        })
      )
      dots.append(list)
      return [emblaA11y({ label: 'Featured products', dots })]
    }
  })

  const fresh = document.createElement('button')
  fresh.type = 'button'
  buttons.dots.querySelector('li')?.replaceChildren(fresh)

  await expect.element(page.getByRole('button', { name: 'Folie 1' })).toBeVisible()
})

test('keeps a dot name that the browser translated', async () => {
  const { buttons, emblaApi } = createCarousel({
    slideCount: 2,
    slideWidth: '100%',
    dotTexts: ['', ''],
    dotsAttributes: germanTemplate,
    plugins: ({ dots }) => [emblaA11y({ label: 'Featured products', dots })]
  })
  const generatedName = buttons.dots.children[0]?.querySelector('span')
  if (generatedName === undefined || generatedName === null) throw new Error('No dot name')

  generatedName.replaceChildren(document.createTextNode('Slide 1'))
  emblaApi.goTo(1, true)
  await new Promise((resolve) => setTimeout(resolve, 50))

  await expect.element(page.getByRole('button', { name: 'Slide 1' })).toBeVisible()
})

test('gives a dot that was replaced its own markup back', async () => {
  const { buttons } = createCarousel({
    slideCount: 2,
    slideWidth: '100%',
    dotTexts: ['', ''],
    dotsAttributes: germanTemplate,
    plugins: ({ dots }) => [emblaA11y({ label: 'Products', dots })]
  })
  const [replaced] = Array.from(buttons.dots.children)
  if (replaced === undefined) throw new Error('no dot')
  expect(replaced.getAttribute('aria-current')).toBe('true')

  const replacement = document.createElement('button')
  replacement.type = 'button'
  replaced.replaceWith(replacement)

  await expect.poll(() => replacement.getAttribute('aria-current')).toBe('true')
  expect(attributesOf(replaced)).toEqual({ type: 'button' })
  expect(replaced.childNodes).toHaveLength(0)
})

test('restores the dots on destroy', () => {
  const { buttons, emblaApi } = createCarousel({
    slideCount: 2,
    slideWidth: '100%',
    dotTexts: ['', ''],
    dotsAttributes: germanTemplate,
    plugins: ({ dots }) => [emblaA11y({ label: 'Featured products', dots })]
  })

  emblaApi.destroy()

  for (const dot of buttons.dots.children) {
    expect(attributesOf(dot)).toEqual({ type: 'button' })
    expect(dot.childNodes).toHaveLength(0)
  }
})

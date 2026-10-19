import { afterEach, expect, test } from 'vitest'
import { page } from 'vitest/browser'
import emblaA11y from '../src/index.js'
import { attributesOf, createCarousel, removeCarousels } from './fixture.js'

afterEach(removeCarousels)

test('keeps the visible text of a dot as its name', async () => {
  createCarousel({
    slideCount: 2,
    slideWidth: '100%',
    dotTexts: ['Summer collection', 'Winter collection'],
    plugins: ({ dots }) => [emblaA11y({ label: 'Featured products', dots })]
  })

  await expect.element(page.getByRole('button', { name: 'Summer collection' })).toBeVisible()
})

test('marks only the dot of the shown slide as current, whatever the markup said', () => {
  const { buttons } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    dotTexts: ['', '', ''],
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

  await expect.element(page.getByRole('button', { name: 'Go to slide 1' })).toBeVisible()
})

test('keeps a dot name that the browser translated', async () => {
  const { buttons, emblaApi } = createCarousel({
    slideCount: 2,
    slideWidth: '100%',
    dotTexts: ['', ''],
    plugins: ({ dots }) => [emblaA11y({ label: 'Featured products', dots })]
  })
  const generatedName = buttons.dots.children[0]?.querySelector('span')
  if (generatedName === undefined || generatedName === null) throw new Error('No dot name')

  generatedName.replaceChildren(document.createTextNode('Gehe zu Folie 1'))
  emblaApi.goTo(1, true)
  await new Promise((resolve) => setTimeout(resolve, 50))

  await expect.element(page.getByRole('button', { name: 'Gehe zu Folie 1' })).toBeVisible()
})

test('restores the dots on destroy', () => {
  const { buttons, emblaApi } = createCarousel({
    slideCount: 2,
    slideWidth: '100%',
    dotTexts: ['', ''],
    plugins: ({ dots }) => [emblaA11y({ label: 'Featured products', dots })]
  })

  emblaApi.destroy()

  for (const dot of buttons.dots.children) {
    expect(attributesOf(dot)).toEqual({ type: 'button' })
    expect(dot.childNodes).toHaveLength(0)
  }
})

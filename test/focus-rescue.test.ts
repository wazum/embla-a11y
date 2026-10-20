import { afterEach, expect, test } from 'vitest'
import emblaA11y from '../src/index.js'
import { createCarousel, removeCarousels } from './fixture.js'

const checkVisibility = Object.getOwnPropertyDescriptor(Element.prototype, 'checkVisibility')

afterEach(() => {
  removeCarousels()
  if (checkVisibility !== undefined) {
    Object.defineProperty(Element.prototype, 'checkVisibility', checkVisibility)
  }
})

test('moves focus to a link in an image map of the next slide', async () => {
  const { slides } = createCarousel({ plugins: [emblaA11y({ label: 'Products' })] })
  const link = slides[0]?.querySelector('a')
  slides[1]?.replaceChildren()
  const map = document.createElement('map')
  map.name = 'products'
  const area = document.createElement('area')
  area.href = '#product-2'
  area.alt = 'Product 2'
  area.shape = 'rect'
  area.coords = '0,0,50,50'
  map.append(area)
  const image = document.createElement('img')
  image.useMap = '#products'
  image.width = 50
  image.height = 50
  image.alt = ''
  slides[1]?.append(map, image)
  link?.focus()

  link?.remove()

  await expect.poll(() => document.activeElement).toBe(area)
})

test('moves focus on in browsers without checkVisibility', async () => {
  Reflect.deleteProperty(Element.prototype, 'checkVisibility')
  const { slides } = createCarousel({ plugins: [emblaA11y({ label: 'Products' })] })
  const link = slides[0]?.querySelector('a')
  link?.focus()

  link?.remove()

  await expect.poll(() => document.activeElement).toBe(slides[1]?.querySelector('a'))
})

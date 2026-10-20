import { afterEach, expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import emblaA11y from '../src/index.js'
import { attributesOf, createCarousel, removeCarousels } from './fixture.js'

afterEach(() => {
  removeCarousels()
  vi.restoreAllMocks()
  emblaA11y.globalOptions = undefined
})

test('takes options from globalOptions, and options per carousel win', async () => {
  emblaA11y.globalOptions = { label: 'Featured products' }

  createCarousel({ plugins: [emblaA11y()] })
  createCarousel({ plugins: [emblaA11y({ label: 'New arrivals' })] })

  await expect.element(page.getByRole('region', { name: 'Featured products' })).toBeVisible()
  await expect.element(page.getByRole('region', { name: 'New arrivals' })).toBeVisible()
})

test('names the region after a visible heading', async () => {
  createCarousel({
    heading: { id: 'products-heading', text: 'Featured products' },
    plugins: [emblaA11y({ labelledBy: 'products-heading' })]
  })

  await expect.element(page.getByRole('region', { name: 'Featured products' })).toBeVisible()
})

test('names the region with a label when there is no heading', async () => {
  createCarousel({ plugins: [emblaA11y({ label: 'Featured products' })] })

  await expect.element(page.getByRole('region', { name: 'Featured products' })).toBeVisible()
})

test('puts the controls inside the region', async () => {
  createCarousel({ plugins: [emblaA11y({ label: 'Featured products' })] })
  const region = page.getByRole('region', { name: 'Featured products' })

  await expect.element(region.getByRole('button', { name: 'Previous' })).toBeVisible()
  await expect.element(region.getByRole('button', { name: 'Next' })).toBeVisible()
})

test('adds no region and warns when the carousel has no name', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  createCarousel({ plugins: [emblaA11y()] })

  expect(page.getByRole('region').elements()).toHaveLength(0)
  expect(warn).toHaveBeenCalledOnce()
})

test('makes a div the author named a region, and takes the role back on destroy', async () => {
  const { wrapper, emblaApi } = createCarousel({
    wrapperAttributes: { 'aria-labelledby': 'products-heading' },
    heading: { id: 'products-heading', text: 'Featured products' },
    plugins: [emblaA11y()]
  })

  await expect.element(page.getByRole('region', { name: 'Featured products' })).toBeVisible()

  emblaApi.destroy()

  expect(wrapper.hasAttribute('role')).toBe(false)
  expect(wrapper.getAttribute('aria-labelledby')).toBe('products-heading')
})

test('leaves the body alone and warns when the viewport has no wrapper', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  createCarousel({ wrapperTag: null, plugins: [emblaA11y({ label: 'Featured products' })] })

  expect(attributesOf(document.body)).toEqual({})
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('no element around the viewport'))
})

test("keeps the author's own role on a named div", () => {
  const { wrapper } = createCarousel({
    wrapperAttributes: { role: 'group', 'aria-label': 'Featured products' },
    plugins: [emblaA11y()]
  })

  expect(wrapper.getAttribute('role')).toBe('group')
})

test("keeps the author's own region name", async () => {
  createCarousel({
    wrapperTag: 'section',
    wrapperAttributes: { 'aria-labelledby': 'products-heading' },
    heading: { id: 'products-heading', text: 'Featured products' },
    plugins: [emblaA11y({ label: 'Something else' })]
  })

  await expect.element(page.getByRole('region', { name: 'Featured products' })).toBeVisible()
  expect(page.getByRole('region', { name: 'Something else' }).elements()).toHaveLength(0)
})

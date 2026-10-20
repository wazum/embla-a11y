import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=three-per-view')
})

test('moves focus to Previous when the focused Next button gets disabled', async ({ page }) => {
  await page.getByRole('button', { name: 'Next' }).focus()

  await page.evaluate(() =>
    document.querySelector<HTMLButtonElement>('.embla__next')?.toggleAttribute('disabled', true)
  )

  await expect(page.getByRole('button', { name: 'Previous' })).toBeFocused()
})

test('moves focus to Next when the focused Previous button gets hidden', async ({ page }) => {
  await page.getByRole('button', { name: 'Previous' }).focus()

  await page.evaluate(() =>
    document.querySelector<HTMLButtonElement>('.embla__prev')?.toggleAttribute('hidden', true)
  )

  await expect(page.getByRole('button', { name: 'Next' })).toBeFocused()
})

test('moves focus to the next slide when the focused slide is removed', async ({ page }) => {
  await page.getByRole('link', { name: 'Details for product 3' }).focus()

  await page.evaluate(() => document.querySelectorAll('.embla__slide')[2]?.remove())

  await expect(page.getByRole('link', { name: 'Details for product 4' })).toBeFocused()
})

test('moves focus to Previous when the focused Next button becomes invisible', async ({ page }) => {
  await page.getByRole('button', { name: 'Next' }).focus()

  await page.evaluate(() => {
    const next = document.querySelector<HTMLButtonElement>('.embla__next')
    if (next !== null) next.style.visibility = 'hidden'
  })

  await expect(page.getByRole('button', { name: 'Previous' })).toBeFocused()
})

test('forgets focus that left the page before the slide is removed', async ({ page }) => {
  await page.getByRole('link', { name: 'Details for product 3' }).focus()
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  })

  await page.evaluate(() => document.querySelectorAll('.embla__slide')[2]?.remove())
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 50)))

  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true)
})

test('leaves focus alone after the user moved it out of the carousel', async ({ page }) => {
  await page.getByRole('link', { name: 'Details for product 3' }).focus()
  const elsewhere = page.getByRole('link', { name: 'All variants' })
  await elsewhere.focus()

  await page.evaluate(() => document.querySelectorAll('.embla__slide')[2]?.remove())
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 50)))

  await expect(elsewhere).toBeFocused()
})

test('moves focus to the neighbour after earlier slides were removed', async ({ page }) => {
  await page.getByRole('link', { name: 'Details for product 5' }).focus()
  await page.evaluate(() => document.querySelectorAll('.embla__slide')[0]?.remove())
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 50)))

  await page.evaluate(() =>
    Array.from(document.querySelectorAll('.embla__slide'))
      .find((slide) => slide.textContent.includes('Product 5'))
      ?.remove()
  )

  await expect(page.getByRole('link', { name: 'Details for product 6' })).toBeFocused()
})

test('moves focus to the region when the only slide is removed', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=single-slide')
  await page.getByRole('link', { name: 'Details for product 1' }).focus()

  await page.evaluate(() => document.querySelector('.embla__slide')?.remove())

  await expect(page.getByRole('region', { name: 'Featured products' })).toBeFocused()
})

test('moves focus to the following slide when the focused first slide is hidden', async ({
  page
}) => {
  await page.getByRole('link', { name: 'Details for product 1', exact: true }).focus()

  await page.evaluate(() =>
    document.querySelector('.embla__slide')?.toggleAttribute('hidden', true)
  )

  await expect(page.getByRole('link', { name: 'Details for product 2' })).toBeFocused()
})

test('moves focus to the previous slide when the last slide is removed', async ({ page }) => {
  await page.getByRole('link', { name: 'Details for product 10' }).focus()

  await page.evaluate(() => document.querySelectorAll('.embla__slide')[9]?.remove())

  await expect(page.getByRole('link', { name: 'Details for product 9' })).toBeFocused()
})

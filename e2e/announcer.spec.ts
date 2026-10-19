import { expect, test } from '@playwright/test'

test('says nothing after the page loads', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=three-per-view')
  await page.waitForTimeout(500)

  await expect(page.locator('.embla__announcer')).toHaveText('')
})

test('announces the shown slides after Next', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=three-per-view')

  await page.getByRole('button', { name: 'Next' }).click()

  await expect(page.locator('.embla__announcer')).toHaveText('Slides 2 to 4 of 10')
})

test('announces the shown slides in screen order across the loop seam', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=loop')

  await page.getByRole('button', { name: 'Previous' }).click()

  await expect(page.locator('.embla__announcer')).toHaveText('Slides 9 to 1 of 10')
  const productNine = await page.getByRole('heading', { name: 'Product 9' }).boundingBox()
  const productOne = await page
    .getByRole('heading', { name: 'Product 1', exact: true })
    .boundingBox()
  expect(productNine?.x).toBeLessThan(productOne?.x ?? 0)
})

test('announces the shown slide after a dot press', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=one-per-view')

  await page.getByRole('button', { name: 'Go to slide 4', exact: true }).click()

  await expect(page.locator('.embla__announcer')).toHaveText('Slide 4 of 10')
})

test('announces the shown slides after a drag', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=three-per-view')
  const box = await page.locator('.embla').boundingBox()
  if (box === null) throw new Error('Viewport not visible')

  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2, { steps: 10 })
  await page.mouse.up()

  await expect(page.locator('.embla__announcer')).toHaveText(/^Slides \d+ to \d+ of 10$/)
})

test('stays silent while autoplay moves the carousel', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=autoplay')
  await page.waitForTimeout(2500)

  await expect(page.locator('.embla__announcer')).toHaveText('')
})

test('stays silent when Tab brings a slide into view', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=three-per-view')
  await page.getByRole('button', { name: 'Add product 3 to cart' }).focus()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('heading', { name: 'Product 4' })).toBeInViewport()
  await page.waitForTimeout(500)

  await expect(page.locator('.embla__announcer')).toHaveText('')
})

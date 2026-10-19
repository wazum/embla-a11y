import { expect, test, type Page } from '@playwright/test'

function isRotating(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const plugins = window.emblaApi?.plugins()
    return plugins?.autoplay?.isPlaying() === true || plugins?.autoScroll?.isPlaying() === true
  })
}

function focusedSlideIsVisible(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const viewport = document.querySelector('.embla')
    const focused = document.activeElement
    if (viewport === null || focused === null) return false
    const viewportRect = viewport.getBoundingClientRect()
    const focusedRect = focused.getBoundingClientRect()
    return focusedRect.left >= viewportRect.left - 1 && focusedRect.right <= viewportRect.right + 1
  })
}

for (const variant of ['autoplay', 'auto-scroll']) {
  test.describe(variant, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/e2e/pages/carousel.html?variant=${variant}`)
      await expect.poll(() => isRotating(page)).toBe(true)
    })

    test('stops for good when a script or screen reader moves focus into a slide', async ({
      page
    }) => {
      await page.getByRole('link', { name: 'Details for product 6' }).focus()

      await expect.poll(() => isRotating(page)).toBe(false)
      await page.waitForTimeout(1500)
      expect(await isRotating(page)).toBe(false)
      expect(await focusedSlideIsVisible(page)).toBe(true)
    })

    test('stays stopped through a resize after the user stopped it', async ({ page }) => {
      await page.getByRole('link', { name: 'Details for product 2' }).focus()
      await expect.poll(() => isRotating(page)).toBe(false)

      await page.setViewportSize({ width: 700, height: 800 })
      await page.waitForTimeout(1500)

      expect(await isRotating(page)).toBe(false)
    })

    test('keeps rotating through a resize when nobody stopped it', async ({ page }) => {
      await page.setViewportSize({ width: 700, height: 800 })
      await page.waitForTimeout(1500)

      expect(await isRotating(page)).toBe(true)
    })
  })
}

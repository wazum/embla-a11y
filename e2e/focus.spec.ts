import { expect, test, type Page } from '@playwright/test'
import { variants } from './variants.js'

type FocusState = { nativeScroll: number; focusedFullyVisible: boolean }

function focusState(page: Page): Promise<FocusState> {
  return page.evaluate(() => {
    const viewport = document.querySelector('.embla')
    const focused = document.activeElement
    if (viewport === null || focused === null) throw new Error('Nothing to measure')
    const viewportRect = viewport.getBoundingClientRect()
    const focusedRect = focused.getBoundingClientRect()
    return {
      nativeScroll: Math.abs(viewport.scrollLeft) + Math.abs(viewport.scrollTop),
      focusedFullyVisible:
        focusedRect.left >= viewportRect.left - 1 &&
        focusedRect.right <= viewportRect.right + 1 &&
        focusedRect.top >= viewportRect.top - 1 &&
        focusedRect.bottom <= viewportRect.bottom + 1
    }
  })
}

const visibleAndUnscrolled: FocusState = { nativeScroll: 0, focusedFullyVisible: true }

test('a click on a partly visible button reaches that button', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=peek')
  const button = page.getByRole('button', { name: 'Add product 3 to cart' })
  const buttonBox = await button.boundingBox()
  const viewportBox = await page.locator('.embla').boundingBox()
  if (buttonBox === null || viewportBox === null) throw new Error('Nothing to click')
  const visibleRight = Math.min(buttonBox.x + buttonBox.width, viewportBox.x + viewportBox.width)
  expect(visibleRight).toBeLessThan(buttonBox.x + buttonBox.width)

  await page.mouse.click((buttonBox.x + visibleRight) / 2, buttonBox.y + buttonBox.height / 2)

  await expect(page.getByText('Added product 3')).toBeVisible()
})

test('keeps the carousel still when Tab reaches an element that is already visible', async ({
  page
}) => {
  await page.goto('/e2e/pages/carousel.html?variant=three-per-view')
  await page.getByRole('button', { name: 'Add product 2 to cart' }).focus()

  await page.keyboard.press('Tab')

  await expect(page.getByRole('link', { name: 'Details for product 3' })).toBeFocused()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Product 1', exact: true })).toBeInViewport()
})

test('keeps the carousel still when Shift+Tab reaches an element that is already visible', async ({
  page
}) => {
  await page.goto('/e2e/pages/carousel.html?variant=three-per-view')
  await page.getByRole('link', { name: 'Details for product 10' }).focus()
  await expect(page.getByRole('heading', { name: 'Product 10' })).toBeInViewport()

  await page.keyboard.press('Shift+Tab')

  await expect(page.getByRole('button', { name: 'Add product 9 to cart' })).toBeFocused()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Product 8' })).toBeInViewport()
})

test('stays put when the browser restores focus after the window was left', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=three-per-view')
  await page.getByRole('link', { name: 'Details for product 1', exact: true }).focus()
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        window.emblaApi?.on('settle', resolve)
        window.emblaApi?.goTo(5)
      })
  )

  await page.evaluate(() => {
    const link = document.activeElement
    if (!(link instanceof HTMLElement)) throw new Error('Nothing focused')
    window.dispatchEvent(new FocusEvent('blur'))
    link.blur()
    window.dispatchEvent(new FocusEvent('focus'))
    link.focus()
  })

  await expect(page.getByRole('heading', { name: 'Product 6' })).toBeInViewport()
  await expect(page.getByRole('heading', { name: 'Product 1', exact: true })).not.toBeInViewport()
})

test('follows focus again after the window was left with focus elsewhere', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=three-per-view')
  await page.evaluate(() => {
    window.dispatchEvent(new FocusEvent('blur'))
    window.dispatchEvent(new FocusEvent('focus'))
  })
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 50)))

  await page.getByRole('link', { name: 'Details for product 8' }).focus()

  await expect.poll(() => focusState(page)).toEqual(visibleAndUnscrolled)
})

for (const variant of variants.filter((candidate) => candidate.slides > candidate.perView)) {
  test.describe(variant.name, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/e2e/pages/carousel.html?variant=${variant.name}`)
    })

    test('brings a slide into view when a script focuses it', async ({ page }) => {
      await page.getByRole('link', { name: 'Details for product 8' }).focus()

      await expect.poll(() => focusState(page)).toEqual(visibleAndUnscrolled)
    })

    test('keeps every slide in view while tabbing through', async ({ page }) => {
      await page.getByRole('link', { name: 'Details for product 1', exact: true }).focus()

      for (let step = 0; step < variant.slides * 2 - 1; step++) {
        await page.keyboard.press('Tab')
        await expect.poll(() => focusState(page)).toEqual(visibleAndUnscrolled)
      }
    })
  })
}

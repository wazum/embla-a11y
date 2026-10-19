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

import { expect, test, type Page } from '@playwright/test'
import { variants } from './variants.js'

function visibleLinksThatCannotBeClicked(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const viewport = document.querySelector('.embla')
    if (viewport === null) throw new Error('Viewport not found')
    const viewportRect = viewport.getBoundingClientRect()
    return Array.from(viewport.querySelectorAll('a'))
      .filter((link) => {
        const rect = link.getBoundingClientRect()
        const left = Math.max(rect.left, viewportRect.left, 0)
        const right = Math.min(rect.right, viewportRect.right, window.innerWidth)
        const top = Math.max(rect.top, viewportRect.top, 0)
        const bottom = Math.min(rect.bottom, viewportRect.bottom, window.innerHeight)
        if (right - left < 1 || bottom - top < 1) return false
        const slide = link.closest('.embla__slide')
        if (slide !== null && getComputedStyle(slide).opacity === '0') return false
        const hit = document.elementFromPoint((left + right) / 2, (top + bottom) / 2)
        return hit === null || !link.contains(hit)
      })
      .map((link) => link.textContent)
  })
}

for (const variant of variants) {
  test.describe(`${variant.name} with hideOffscreen`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/e2e/pages/carousel.html?variant=${variant.name}&hideOffscreen`)
    })

    test('keeps every visible link clickable after load, Next and a drag', async ({ page }) => {
      await expect.poll(() => visibleLinksThatCannotBeClicked(page)).toEqual([])

      await page.getByRole('button', { name: 'Next' }).click({ force: true })
      await expect.poll(() => visibleLinksThatCannotBeClicked(page)).toEqual([])

      const box = await page.locator('.embla').boundingBox()
      if (box === null) throw new Error('Viewport not visible')
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2, { steps: 10 })
      await page.mouse.up()
      await expect.poll(() => visibleLinksThatCannotBeClicked(page)).toEqual([])
    })
  })
}

test.describe('three-per-view with hideOffscreen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/pages/carousel.html?variant=three-per-view&hideOffscreen')
  })

  test('Tab skips slides that are off-screen', async ({ page }) => {
    await page.getByRole('button', { name: 'Add product 3 to cart' }).focus()

    await page.keyboard.press('Tab')

    await expect(page.getByRole('button', { name: 'Previous' })).toBeFocused()
  })

  test('Tab through the visible slides keeps the off-screen slides out of reach', async ({
    page
  }) => {
    await page.getByRole('button', { name: 'Add product 2 to cart' }).focus()

    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Details for product 3' })).toBeFocused()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    await expect(page.getByRole('button', { name: 'Previous' })).toBeFocused()
  })

  test('Next makes the newly visible slide reachable', async ({ page }) => {
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('heading', { name: 'Product 4' })).toBeInViewport()
    await page.getByRole('button', { name: 'Add product 3 to cart' }).focus()

    await page.keyboard.press('Tab')

    await expect(page.getByRole('link', { name: 'Details for product 4' })).toBeFocused()
  })

  test('keeps focus on a link whose slide moves out of view', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Details for product 1', exact: true })
    await link.focus()

    await page.evaluate(
      () =>
        new Promise((resolve) => {
          window.emblaApi?.on('settle', resolve)
          window.emblaApi?.goTo(5)
        })
    )

    await expect(link).toBeFocused()
  })

  test('hides a slide that moved away once focus leaves it', async ({ page }) => {
    await page.getByRole('link', { name: 'Details for product 1', exact: true }).focus()
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          window.emblaApi?.on('settle', resolve)
          window.emblaApi?.goTo(5)
        })
    )

    await page.getByRole('button', { name: 'Next' }).focus()

    const canFocusMovedAwayLink = await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('a')).find(
        (candidate) => candidate.textContent === 'Details for product 1'
      )
      link?.focus()
      return document.activeElement === link
    })
    expect(canFocusMovedAwayLink).toBe(false)
  })

  test('hides nothing while the carousel is still moving', async ({ page }) => {
    await page.evaluate(() => window.emblaApi?.reInit({ duration: 200 }))
    const link = page.getByRole('link', { name: 'Details for product 1', exact: true })
    await link.focus()
    await page.evaluate(() => window.emblaApi?.goTo(7))
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const firstSlide = window.emblaApi?.slideNodes()[0]
            const viewport = window.emblaApi?.rootNode()
            if (firstSlide === undefined || viewport === undefined) return false
            return firstSlide.getBoundingClientRect().right <= viewport.getBoundingClientRect().left
          }),
        { intervals: [10] }
      )
      .toBe(true)

    await page.getByRole('button', { name: 'Next' }).focus()

    const stillMoving = await page.evaluate(() => {
      const target = window.emblaApi?.internalEngine().target.get()
      const location = window.emblaApi?.internalEngine().location.get()
      return target !== location
    })
    const canFocusLeavingLink = await page.evaluate(() => {
      const leavingLink = Array.from(document.querySelectorAll('a')).find(
        (candidate) => candidate.textContent === 'Details for product 1'
      )
      leavingLink?.focus()
      return document.activeElement === leavingLink
    })
    expect(stillMoving, 'carousel should still be moving').toBe(true)
    expect(canFocusLeavingLink, 'leaving slide should stay reachable').toBe(true)
  })
})

test('keeps visible slides reachable when a hidden carousel is shown', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=three-per-view&hideOffscreen&hidden')

  await page.evaluate(() => {
    const section = document.querySelector('section')
    if (section !== null) section.hidden = false
  })

  await expect.poll(() => visibleLinksThatCannotBeClicked(page)).toEqual([])
  await expect(page.getByRole('link', { name: 'Details for product 1', exact: true })).toBeVisible()
})

test('keeps the new slide reachable after an instant fade', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=fade&hideOffscreen')

  await page.evaluate(() => window.emblaApi?.goToNext(true))

  await expect.poll(() => visibleLinksThatCannotBeClicked(page)).toEqual([])
})

test('Tab skips slides that have faded out', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=fade&hideOffscreen')
  await page.getByRole('button', { name: 'Add product 1 to cart' }).focus()

  await page.keyboard.press('Tab')

  await expect(page.getByRole('button', { name: 'Previous' })).toBeFocused()
})

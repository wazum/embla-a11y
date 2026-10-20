import { expect, test, type Locator, type Page } from '@playwright/test'

const afterSettle = { timeout: 10_000 }

test.beforeEach(async ({ page }) => {
  await page.goto('/demo/index.html')
  await expect(page.locator('.carousel__dot').first()).toBeAttached()
})

test.describe('Basics', () => {
  test('Next becomes unavailable at the end and keeps focus', async ({ page }) => {
    const demo = page.locator('#basics')
    const next = demo.getByRole('button', { name: 'Next', exact: true })
    await next.focus()

    for (let press = 0; press < 12; press++) {
      if ((await next.getAttribute('aria-disabled')) === 'true') break
      await page.keyboard.press('Enter')
      await page.waitForTimeout(150)
    }

    await expect(next).toHaveAttribute('aria-disabled', 'true')
    await expect(next).toBeFocused()
  })

  test('announces the new position after a press', async ({ page }) => {
    const demo = page.locator('#basics')

    await demo.getByRole('button', { name: 'Next', exact: true }).click()

    await expect(demo.locator('.carousel__announcer')).toHaveText(
      /^Slides? \d+( to \d+)? of 10$/,
      afterSettle
    )
  })

  test('is a region named Basics', async ({ page }) => {
    await expect(page.getByRole('region', { name: 'Basics' })).toBeVisible()
  })

  test('marks the current dot and names every dot', async ({ page }) => {
    const dots = page.locator('#basics .carousel__dot')

    await expect(page.locator('#basics .carousel__dot[aria-current="true"]')).toHaveCount(1)
    for (const name of await dots.allTextContents()) {
      expect(name).toMatch(/^Slides? \d+( to \d+)?$/)
    }
  })

  test('names the buttons by their visible text for voice control', async ({ page }) => {
    const demo = page.locator('#basics')

    await expect(demo.getByRole('button', { name: 'Save Vienna', exact: true })).toBeVisible()
    await expect(demo.getByRole('button', { name: 'Next', exact: true })).toBeVisible()
  })
})

test.describe('Partly visible slides', () => {
  test('Tab onto a partly visible slide brings it fully into view', async ({ page }) => {
    const demo = page.locator('#peek')
    const partlyVisible = await firstPartlyVisibleSlide(demo)
    await demo
      .locator('.slide')
      .nth(partlyVisible - 2)
      .locator('.slide__action')
      .focus()

    await page.keyboard.press('Tab')

    await expect(
      demo
        .locator('.slide')
        .nth(partlyVisible - 1)
        .locator('.slide__action')
    ).toBeFocused()
    await expect.poll(() => focusedSlideFullyVisible(page)).toBe(true)
  })

  test('a click on a partly visible slide lands where it was pressed', async ({ page }) => {
    const demo = page.locator('#peek')
    const partlyVisible = await firstPartlyVisibleSlide(demo)
    const button = demo
      .locator('.slide')
      .nth(partlyVisible - 1)
      .locator('.slide__action')
    const before = await visibleSlides(demo)
    const point = await visiblePoint(button)

    await page.mouse.click(point.x, point.y)
    await page.waitForTimeout(600)

    await expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(await visibleSlides(demo)).toEqual(before)
  })
})

test.describe('Scroll by view', () => {
  test('each dot names its group, and the announcement repeats it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const demo = page.locator('#groups')
    const dots = demo.locator('.carousel__dot')
    await expect(dots.first()).toHaveText('Slides 1 to 2')
    const names = await dots.allTextContents()
    expect(coveredSlides(names)).toEqual(Array.from({ length: 10 }, (_, index) => index + 1))

    await dots.nth(2).click()

    await expect(demo.locator('.carousel__announcer')).toHaveText(
      `${names[2] ?? ''} of 10`,
      afterSettle
    )
  })

  test('the groups and dot names follow a narrower window', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const dots = page.locator('#groups .carousel__dot')
    await expect(dots.first()).toHaveText('Slides 1 to 2')
    const wideCount = await dots.count()

    await page.setViewportSize({ width: 400, height: 900 })

    await expect(dots.first()).toHaveText('Slide 1')
    expect(await dots.count()).toBeGreaterThan(wideCount)
  })
})

test.describe('Loop', () => {
  test('neither button is ever unavailable', async ({ page }) => {
    const demo = page.locator('#loop')

    for (const name of ['Previous', 'Next']) {
      await expect(demo.getByRole('button', { name, exact: true })).not.toHaveAttribute(
        'aria-disabled',
        'true'
      )
    }
  })

  test('Previous right away moves to the last slides and announces it', async ({ page }) => {
    const demo = page.locator('#loop')

    await demo.getByRole('button', { name: 'Previous', exact: true }).click()

    await expect.poll(() => visibleSlides(demo)).toContain(10)
    await expect(demo.locator('.carousel__announcer')).toHaveText(/of 10$/, afterSettle)
  })

  test('Tab brings every slide into view, also across the seam', async ({ page }) => {
    const demo = page.locator('#loop')
    await demo.getByRole('button', { name: 'Save Vienna', exact: true }).focus()

    for (const city of [
      'Berlin',
      'Paris',
      'Rome',
      'Madrid',
      'Lisbon',
      'Amsterdam',
      'Prague',
      'Budapest',
      'Athens'
    ]) {
      await page.keyboard.press('Tab')
      await expect(demo.getByRole('button', { name: `Save ${city}`, exact: true })).toBeFocused()
      await expect.poll(() => focusedSlideFullyVisible(page)).toBe(true)
    }
  })
})

test.describe('Autoplay', () => {
  test('focus on the rotation button alone does not stop it, a press does', async ({ page }) => {
    const demo = page.locator('#autoplay')
    await rotationButton(demo, 'Stop slide rotation').focus()
    await page.waitForTimeout(300)
    await expect(rotationButton(demo, 'Stop slide rotation')).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(rotationButton(demo, 'Start slide rotation')).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(rotationButton(demo, 'Stop slide rotation')).toBeFocused()
  })

  test('Tab into a slide stops the rotation', async ({ page }) => {
    const demo = page.locator('#autoplay')
    await rotationButton(demo, 'Stop slide rotation').focus()

    await page.keyboard.press('Tab')

    await expect(demo.locator('.slide__action:focus')).toHaveCount(1)
    await expect(rotationButton(demo, 'Start slide rotation')).toBeVisible()
  })

  test('a press anywhere in the carousel stops the rotation', async ({ page }) => {
    const demo = page.locator('#autoplay')
    const point = await visiblePoint(demo.locator('.carousel__viewport'))

    await page.mouse.click(point.x, point.y)

    await expect(rotationButton(demo, 'Start slide rotation')).toBeVisible()
  })

  test('announces nothing while it moves by itself', async ({ page }) => {
    const demo = page.locator('#autoplay')
    const before = await visibleSlides(demo)

    await expect.poll(() => visibleSlides(demo), { timeout: 10_000 }).not.toEqual(before)

    await expect(demo.locator('.carousel__announcer')).toHaveText('')
  })

  test('does not start with reduced motion, but the button starts it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    const demo = page.locator('#autoplay')
    await expect(rotationButton(demo, 'Start slide rotation')).toBeVisible()

    await rotationButton(demo, 'Start slide rotation').click()

    await expect(rotationButton(demo, 'Stop slide rotation')).toBeVisible()
  })
})

test.describe('AutoScroll', () => {
  test('the rotation button stops and starts the scrolling', async ({ page }) => {
    const demo = page.locator('#auto-scroll')
    await rotationButton(demo, 'Stop slide rotation').focus()

    await page.keyboard.press('Enter')
    await expect(rotationButton(demo, 'Start slide rotation')).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(rotationButton(demo, 'Stop slide rotation')).toBeFocused()
  })

  test('Tab into a slide stops for good and shows the slide fully', async ({ page }) => {
    const demo = page.locator('#auto-scroll')
    await rotationButton(demo, 'Stop slide rotation').focus()

    await page.keyboard.press('Tab')

    await expect(rotationButton(demo, 'Start slide rotation')).toBeVisible()
    await expect.poll(() => focusedSlideFullyVisible(page)).toBe(true)
  })

  test('a click on a slide button stops it where it is', async ({ page }) => {
    const demo = page.locator('#auto-scroll')
    const point = await visiblePoint(demo.locator('.slide__action').first())

    await page.mouse.click(point.x, point.y)

    await expect(rotationButton(demo, 'Start slide rotation')).toBeVisible()
    await expect(demo.locator('.slide__action[aria-pressed="true"]')).toHaveCount(1)
  })
})

test.describe('Fade', () => {
  test('focus on a Save button fades its own slide in', async ({ page }) => {
    const demo = page.locator('#fade')
    await demo.getByRole('button', { name: 'Save Vienna', exact: true }).focus()

    await page.keyboard.press('Tab')

    await expect(demo.getByRole('button', { name: 'Save Berlin', exact: true })).toBeFocused()
    await expect.poll(() => opacity(demo.locator('.slide').nth(1))).toBe('1')
    await expect.poll(() => opacity(demo.locator('.slide').nth(0))).toBe('0')
  })

  test('Next announces the single slide', async ({ page }) => {
    const demo = page.locator('#fade')

    await demo.getByRole('button', { name: 'Next', exact: true }).click()

    await expect(demo.locator('.carousel__announcer')).toHaveText('Slide 2 of 10', afterSettle)
  })
})

test.describe('Removing slides', () => {
  test('removing a slide moves focus into the next slide', async ({ page }) => {
    const demo = page.locator('#focus-rescue')
    await demo.getByRole('button', { name: 'Remove Vienna', exact: true }).focus()

    await page.keyboard.press('Enter')

    await expect(demo.getByRole('button', { name: 'Remove Berlin', exact: true })).toBeFocused()
  })

  test('removing the last slide moves focus to the slide before', async ({ page }) => {
    const demo = page.locator('#focus-rescue')
    await demo.getByRole('button', { name: 'Remove Athens', exact: true }).focus()

    await page.keyboard.press('Enter')

    await expect(demo.getByRole('button', { name: 'Remove Budapest', exact: true })).toBeFocused()
  })

  test('removing every slide gives focus to the carousel, and all can come back', async ({
    page
  }) => {
    const demo = page.locator('#focus-rescue')
    await demo.getByRole('button', { name: 'Remove Vienna', exact: true }).focus()

    for (let removed = 0; removed < 10; removed++) {
      await expect(demo.locator('.slide__action:focus')).toHaveCount(1)
      await page.keyboard.press('Enter')
    }

    await expect(demo.locator('.slide')).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'Removing slides' })).toBeFocused()

    await demo.getByRole('button', { name: 'Bring back all cities' }).click()
    await expect(demo.locator('.slide')).toHaveCount(10)
  })
})

test.describe('Hiding off-screen slides', () => {
  test('a skip link appears before the carousel and jumps past it', async ({ page }) => {
    await page.locator('#focus-rescue .demo__more a').focus()

    await page.keyboard.press('Tab')

    const skipLink = page.getByRole('link', { name: 'Skip past the hidden-slides demo' })
    await expect(skipLink).toBeFocused()
    expect((await skipLink.boundingBox())?.width ?? 0).toBeGreaterThan(24)
    await page.keyboard.press('Enter')
    await expect(page.locator('#after-hide-offscreen')).toBeFocused()
  })

  test('Tab reaches only the slides on screen', async ({ page }) => {
    const demo = page.locator('#hide-offscreen')
    await expect(demo.locator('.slide[inert]').first()).toBeAttached()
    await page.getByRole('link', { name: 'Skip past the hidden-slides demo' }).focus()

    const reached: string[] = []
    for (let press = 0; press < 12; press++) {
      await page.keyboard.press('Tab')
      if ((await demo.locator('.slide__action:focus').count()) === 0) break
      await expect.poll(() => focusedSlideFullyVisible(page)).toBe(true)
      reached.push(await page.evaluate(() => document.activeElement?.textContent ?? ''))
    }

    expect(reached.length).toBeGreaterThan(0)
    expect(reached.length).toBeLessThan(10)
    await expect(demo.getByRole('button', { name: 'Previous', exact: true })).toBeFocused()
  })

  test('every slide keeps the full count for screen readers', async ({ page }) => {
    const slides = page.locator('#hide-offscreen .slide')

    for (const slide of await slides.all()) {
      await expect(slide).toHaveAttribute('aria-setsize', '10')
    }
  })
})

test.describe('Vertical', () => {
  test('Tab brings each slide into view', async ({ page }) => {
    const demo = page.locator('#vertical')
    await demo.getByRole('button', { name: 'Save Vienna', exact: true }).focus()

    for (const city of ['Berlin', 'Paris', 'Rome']) {
      await page.keyboard.press('Tab')
      await expect(demo.getByRole('button', { name: `Save ${city}`, exact: true })).toBeFocused()
      await expect.poll(() => focusedSlideFullyVisible(page)).toBe(true)
    }
  })

  test('Next becomes unavailable at the end and keeps focus', async ({ page }) => {
    const next = page.locator('#vertical').getByRole('button', { name: 'Next', exact: true })
    await next.focus()

    for (let press = 0; press < 12; press++) {
      if ((await next.getAttribute('aria-disabled')) === 'true') break
      await page.keyboard.press('Enter')
      await page.waitForTimeout(150)
    }

    await expect(next).toHaveAttribute('aria-disabled', 'true')
    await expect(next).toBeFocused()
  })
})

test.describe('German', () => {
  test('announces the position in German', async ({ page }) => {
    const demo = page.locator('#german')
    await expect(page.getByRole('region', { name: 'Städte in Europa' })).toHaveAttribute(
      'lang',
      'de'
    )

    await demo.getByRole('button', { name: 'Weiter', exact: true }).click()

    await expect(demo.locator('.carousel__announcer')).toHaveText(
      /^Folien? \d+( bis \d+)? von 10$/,
      afterSettle
    )
  })

  test('names the dots with text in the page, which translation can reach', async ({ page }) => {
    const firstDot = page.locator('#german .carousel__dot').first()

    await expect(firstDot).not.toHaveAttribute('aria-label')
    await expect(firstDot).toHaveText(/^Folien? 1( bis \d+)?$/)
  })
})

function rotationButton(demo: Locator, name: string): Locator {
  return demo.getByRole('button', { name, exact: true })
}

function visibleSlides(demo: Locator): Promise<number[]> {
  return demo.evaluate((root) => {
    const viewport = root.querySelector('.carousel__viewport')
    if (viewport === null) throw new Error('Viewport not found')
    const outer = viewport.getBoundingClientRect()
    return Array.from(root.querySelectorAll('.slide__card')).flatMap((card, index) => {
      const inner = card.getBoundingClientRect()
      const inside =
        inner.left >= outer.left - 1 &&
        inner.right <= outer.right + 1 &&
        inner.top >= outer.top - 1 &&
        inner.bottom <= outer.bottom + 1
      return inside ? [index + 1] : []
    })
  })
}

function firstPartlyVisibleSlide(demo: Locator): Promise<number> {
  return demo.evaluate((root) => {
    const viewport = root.querySelector('.carousel__viewport')
    if (viewport === null) throw new Error('Viewport not found')
    const outer = viewport.getBoundingClientRect()
    const index = Array.from(root.querySelectorAll('.slide__card')).findIndex((card) => {
      const inner = card.getBoundingClientRect()
      return inner.left < outer.right - 1 && inner.right > outer.right + 1
    })
    if (index < 1) throw new Error('No partly visible slide after a visible one')
    return index + 1
  })
}

function focusedSlideFullyVisible(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const card = document.activeElement?.closest('.slide')?.querySelector('.slide__card')
    const viewport = card?.closest('.carousel__viewport')
    if (card === undefined || card === null || viewport === undefined || viewport === null) {
      return false
    }
    const outer = viewport.getBoundingClientRect()
    const inner = card.getBoundingClientRect()
    return (
      inner.left >= outer.left - 1 &&
      inner.right <= outer.right + 1 &&
      inner.top >= outer.top - 1 &&
      inner.bottom <= outer.bottom + 1
    )
  })
}

async function visiblePoint(element: Locator): Promise<{ x: number; y: number }> {
  return element.evaluate((node) => {
    node.closest('.demo')?.scrollIntoView({ block: 'center', behavior: 'instant' })
    const viewport = node.closest('.carousel__viewport') ?? node
    const outer = viewport.getBoundingClientRect()
    const inner = node.getBoundingClientRect()
    const left = Math.max(inner.left, outer.left)
    const right = Math.min(inner.right, outer.right)
    return { x: (left + right) / 2, y: inner.top + inner.height / 2 }
  })
}

function coveredSlides(dotNames: string[]): number[] {
  return dotNames.flatMap((name) => {
    const [first, last] = (name.match(/\d+/g) ?? []).map(Number)
    if (first === undefined) return []
    return Array.from({ length: (last ?? first) - first + 1 }, (_, index) => first + index)
  })
}

function opacity(element: Locator): Promise<string> {
  return element.evaluate((node) => getComputedStyle(node).opacity)
}

import { expect, test, type Locator, type Page } from '@playwright/test'

const afterSettle = { timeout: 10_000 }

const cities = [
  'Vienna',
  'Berlin',
  'Paris',
  'Rome',
  'Madrid',
  'Lisbon',
  'Amsterdam',
  'Prague',
  'Budapest',
  'Athens'
]

test.beforeEach(async ({ page }) => {
  await page.goto('/demo/index.html')
  await expect(page.locator('.carousel__dot').first()).toBeAttached()
})

test.describe('Jump to a demo', () => {
  test('the next Tab continues inside the demo you picked', async ({ page }) => {
    const index = page.getByRole('navigation', { name: 'Jump to a demo' })

    await index.getByRole('link', { name: 'Every slide reachable' }).click()

    await expect(page.locator('#every-slide')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip past the every-slide demo' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(
      page.locator('#every-slide').getByRole('button', { name: 'Save Vienna', exact: true })
    ).toBeFocused()
  })

  test('lists every demo', async ({ page }) => {
    const targets = await page
      .getByRole('navigation', { name: 'Jump to a demo' })
      .getByRole('link')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')))
    const demos = await page
      .locator('.demo')
      .evaluateAll((cards) => cards.map((card) => `#${card.id}`))

    expect(targets).toEqual(demos)
  })
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

  test('skips off-screen slides but keeps the full count for screen readers', async ({ page }) => {
    await expect(page.locator('#basics .slide[inert]').first()).toBeAttached()

    for (const slide of await page.locator('#basics .slide').all()) {
      await expect(slide).toHaveAttribute('aria-setsize', '10')
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

test.describe('Partly visible slides, reading backwards', () => {
  test('lands on the last slide you can see, not slide 10', async ({ page }) => {
    const demo = page.locator('#peek')
    const next = demo.getByRole('button', { name: 'Next', exact: true })
    await next.focus()
    for (let press = 0; press < 3; press++) {
      await page.keyboard.press('Enter')
      await page.waitForTimeout(150)
    }
    await expect(demo.locator('.carousel__announcer')).not.toBeEmpty(afterSettle)
    const lastVisible = await demo
      .locator('.slide:not([inert]) .slide__action')
      .last()
      .textContent()

    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Shift+Tab')

    const focused = await page.evaluate(() => document.activeElement?.textContent ?? '')
    expect(focused).toBe(lastVisible)
    expect(focused).not.toBe('Save Athens')
    await expect.poll(() => focusedSlideFullyVisible(page)).toBe(true)
  })
})

test.describe('Scroll by view', () => {
  test('each dot names its page, and the announcement repeats it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const demo = page.locator('#groups')
    const dots = demo.locator('.carousel__dot')
    await expect(dots.first()).toHaveText('Page 1 of 5')
    expect(await dots.allTextContents()).toEqual(
      Array.from({ length: 5 }, (_, index) => `Page ${index + 1} of 5`)
    )

    await dots.nth(2).click()

    await expect(demo.locator('.carousel__announcer')).toHaveText('Page 3 of 5', afterSettle)
  })

  test('the pages follow a narrower window', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const dots = page.locator('#groups .carousel__dot')
    await expect(dots.first()).toHaveText('Page 1 of 5')

    await page.setViewportSize({ width: 400, height: 900 })

    await expect(dots.first()).toHaveText('Page 1 of 10')
    await expect(dots).toHaveCount(10)
  })
})

test.describe('Arrow keys for the dots', () => {
  test('only the current dot is a Tab stop', async ({ page }) => {
    const demo = page.locator('#dot-keys')
    const dots = demo.locator('.carousel__dot')
    await demo.getByRole('button', { name: 'Next', exact: true }).focus()

    await page.keyboard.press('Tab')
    await expect(dots.first()).toBeFocused()
    await page.keyboard.press('Tab')

    await expect(demo.locator('.carousel__dot:focus')).toHaveCount(0)
  })

  test('the arrow keys, Home and End choose a slide, and wrap at the ends', async ({ page }) => {
    const demo = page.locator('#dot-keys')
    const dots = demo.locator('.carousel__dot')
    await dots.first().focus()

    await page.keyboard.press('ArrowRight')
    await expect(dots.nth(1)).toBeFocused()
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true')
    await expect.poll(() => visibleSlides(demo), afterSettle).toEqual([2])

    await page.keyboard.press('End')
    await expect(dots.nth(9)).toBeFocused()
    await page.keyboard.press('Home')
    await expect(dots.first()).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(dots.nth(9)).toBeFocused()
  })

  test('shows a hint that the arrow keys work', async ({ page }) => {
    await expect(
      page.locator('#dot-keys').getByText('Use the arrow keys to choose a slide')
    ).toBeVisible()
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

  test('Previous right away announces the slides across the wrap', async ({ page }) => {
    const demo = page.locator('#loop')
    const warnings = collectWarnings(page)

    await demo.getByRole('button', { name: 'Previous', exact: true }).click()

    await expect.poll(() => visibleSlides(demo)).toContain(10)
    await expect(demo.locator('.carousel__announcer')).toHaveText(
      /^Slides 10 and 1 of 10$/,
      afterSettle
    )
    expect(warnings).toEqual([])
  })

  test('ten presses of Next lead back to Vienna', async ({ page }) => {
    const demo = page.locator('#loop')
    const next = demo.getByRole('button', { name: 'Next', exact: true })
    await next.focus()

    for (let press = 0; press < 10; press++) {
      await page.keyboard.press('Enter')
      await page.waitForTimeout(150)
    }

    await expect.poll(async () => (await visibleSlides(demo))[0], afterSettle).toBe(1)
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
  test('focus never stays on a slide that is faded out', async ({ page }) => {
    const demo = page.locator('#fade')
    await demo.getByRole('button', { name: 'Save Vienna', exact: true }).focus()

    for (let press = 0; press < 10; press++) {
      await page.keyboard.press('Tab')
      const focusedSlide = demo.locator('.slide:has(.slide__action:focus)')
      if ((await focusedSlide.count()) === 0) break
      await expect.poll(() => opacity(focusedSlide)).toBe('1')
    }

    await expect(demo.getByRole('button', { name: 'Previous', exact: true })).toBeFocused()
  })

  test('Next announces the single slide with its heading', async ({ page }) => {
    const demo = page.locator('#fade')

    await demo.getByRole('button', { name: 'Next', exact: true }).click()

    await expect(demo.locator('.carousel__announcer')).toHaveText(
      'Slide 2 of 10: Berlin',
      afterSettle
    )
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
    const next = demo.getByRole('button', { name: 'Next', exact: true })
    await next.focus()
    for (let press = 0; press < 12; press++) {
      if ((await next.getAttribute('aria-disabled')) === 'true') break
      await page.keyboard.press('Enter')
      await page.waitForTimeout(150)
    }
    const removeAthens = demo.getByRole('button', { name: 'Remove Athens', exact: true })
    await expect
      .poll(() => removeAthens.evaluate((button) => button.closest('[inert]') === null))
      .toBe(true)
    await removeAthens.focus()

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

test.describe('Every slide reachable', () => {
  test('a skip link appears before the carousel and jumps past it', async ({ page }) => {
    await page.locator('#focus-rescue .demo__more a').focus()

    await page.keyboard.press('Tab')

    const skipLink = page.getByRole('link', { name: 'Skip past the every-slide demo' })
    await expect(skipLink).toBeFocused()
    expect((await skipLink.boundingBox())?.width ?? 0).toBeGreaterThan(24)
    await page.keyboard.press('Enter')
    await expect(page.locator('#after-every-slide')).toBeFocused()
  })

  test('Tab brings every slide into view in turn', async ({ page }) => {
    const demo = page.locator('#every-slide')
    await demo.getByRole('button', { name: 'Save Vienna', exact: true }).focus()

    for (const city of cities.slice(1)) {
      await page.keyboard.press('Tab')
      await expect(demo.getByRole('button', { name: `Save ${city}`, exact: true })).toBeFocused()
      await expect.poll(() => focusedSlideFullyVisible(page)).toBe(true)
    }
  })

  test('reading backwards from the buttons jumps to slide 10', async ({ page }) => {
    const demo = page.locator('#every-slide')
    const next = demo.getByRole('button', { name: 'Next', exact: true })
    await next.focus()
    for (let press = 0; press < 3; press++) {
      await page.keyboard.press('Enter')
      await page.waitForTimeout(150)
    }

    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Shift+Tab')

    await expect(demo.getByRole('button', { name: 'Save Athens', exact: true })).toBeFocused()
    await expect.poll(() => focusedSlideFullyVisible(page)).toBe(true)
  })

  test('hides no slide, so every heading is in the heading list', async ({ page }) => {
    const region = page.getByRole('region', { name: 'Every slide reachable' })

    await expect(page.locator('#every-slide .slide[inert]')).toHaveCount(0)
    await expect(region.getByRole('heading', { level: 4 })).toHaveCount(10)
  })
})

test.describe('Vertical', () => {
  test('Next moves the slides up and announces the position', async ({ page }) => {
    const demo = page.locator('#vertical')
    await expect(demo.locator('.slide').nth(2)).toHaveAttribute('inert')

    await demo.getByRole('button', { name: 'Next', exact: true }).click()

    await expect.poll(() => visibleSlides(demo)).toContain(3)
    await expect(demo.locator('.carousel__announcer')).toHaveText(
      /^Slides? \d+( to \d+)? of 10$/,
      afterSettle
    )
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

function collectWarnings(page: Page): string[] {
  const warnings: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text())
  })
  return warnings
}

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
    const viewport = node.closest('.carousel__viewport') ?? node
    viewport.scrollIntoView({ block: 'center', behavior: 'instant' })
    const outer = viewport.getBoundingClientRect()
    const inner = node.getBoundingClientRect()
    const left = Math.max(inner.left, outer.left)
    const right = Math.min(inner.right, outer.right)
    return { x: (left + right) / 2, y: inner.top + inner.height / 2 }
  })
}

function opacity(element: Locator): Promise<string> {
  return element.evaluate((node) => getComputedStyle(node).opacity)
}

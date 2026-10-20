import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

const allLevels = [
  'wcag2a',
  'wcag2aa',
  'wcag2aaa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
  'best-practice'
]

test('the demo site logs no warnings or errors', async ({ page }) => {
  const messages: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') messages.push(message.text())
  })
  page.on('pageerror', (error) => messages.push(error.message))

  await page.goto('/demo/index.html')
  await expect(page.locator('.carousel__dot').first()).toBeAttached()

  expect(messages).toEqual([])
})

test('the demo site does not move when the web font arrives late', async ({ page }) => {
  const headingTops = () =>
    page
      .locator('h1, h2, .hero .button')
      .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().top))

  await page.route('**/*.woff2', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await route.continue()
  })
  const fontArrives = page.waitForResponse('**/*.woff2')
  await page.goto('/demo/index.html', { waitUntil: 'commit' })
  await expect(page.locator('.carousel__dot').first()).toBeAttached()
  await page.waitForFunction(() =>
    [...document.fonts].some(
      (face) => face.family.includes('Inter fallback') && face.status === 'loaded'
    )
  )
  const beforeFont = await headingTops()

  await fontArrives
  await page.evaluate(() => document.fonts.ready)
  const afterFont = await headingTops()

  expect(afterFont).toEqual(beforeFont)
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`the demo site has no axe violations up to AAA in ${colorScheme} mode`, async ({ page }) => {
    test.slow()
    await page.emulateMedia({ colorScheme })
    await page.goto('/demo/index.html')
    await expect(page.locator('.carousel__dot').first()).toBeAttached()

    const results = await new AxeBuilder({ page }).withTags(allLevels).analyze()

    expect(results.violations).toEqual([])
  })
}

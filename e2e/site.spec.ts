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

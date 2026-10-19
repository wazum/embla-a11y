import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { variants } from './variants.js'

for (const variant of variants) {
  test.describe(variant.name, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/e2e/pages/carousel.html?variant=${variant.name}`)
    })

    test('has no axe violations', async ({ page }) => {
      const results = await new AxeBuilder({ page }).analyze()

      expect(results.violations).toEqual([])
    })

    test('exposes every slide inside the labelled region', async ({ page }) => {
      const region = page.getByRole('region', { name: 'Featured products' })

      await expect(region.getByRole('heading', { level: 2 })).toHaveCount(variant.slides)
      await expect(region.getByRole('link')).toHaveCount(variant.slides)
      await expect(region.getByRole('button')).toHaveCount(variant.slides)
    })
  })
}

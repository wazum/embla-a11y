import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { variants } from './variants.js'

test('previous and next buttons move the carousel', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=one-per-view')
  const productOne = page.getByRole('heading', { name: 'Product 1', exact: true })
  const productTwo = page.getByRole('heading', { name: 'Product 2', exact: true })

  await page.getByRole('button', { name: 'Next' }).click()
  await expect(productTwo).toBeInViewport()
  await expect(productOne).not.toBeInViewport()

  await page.getByRole('button', { name: 'Previous' }).click()
  await expect(productOne).toBeInViewport()
})

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

      await expect(region.getByRole('heading', { level: 3 })).toHaveCount(variant.slides)
      await expect(region.getByRole('link')).toHaveCount(variant.slides)
      await expect(region.getByRole('button', { name: /^Add product/ })).toHaveCount(variant.slides)
    })

    test('puts the previous and next buttons inside the region', async ({ page }) => {
      const region = page.getByRole('region', { name: 'Featured products' })

      await expect(region.getByRole('button', { name: 'Previous' })).toBeVisible()
      await expect(region.getByRole('button', { name: 'Next' })).toBeVisible()
    })
  })
}

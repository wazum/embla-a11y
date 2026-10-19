import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e/pages/basic.html')
})

test('has no axe violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze()

  expect(results.violations).toEqual([])
})

test('exposes the carousel as a labelled region with every slide readable', async ({ page }) => {
  await expect(page.getByRole('region', { name: 'Featured products' })).toMatchAriaSnapshot(`
    - region "Featured products":
      - link "Product 1"
      - link "Product 2"
      - link "Product 3"
      - link "Product 4"
      - link "Product 5"
      - link "Product 6"
      - link "Product 7"
      - link "Product 8"
  `)
})

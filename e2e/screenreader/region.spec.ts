import { expect } from '@playwright/test'
import { screenReaderTest as test } from '@guidepup/playwright'

test('reaches every visible slide by heading navigation', async ({ page, screenReader }) => {
  await page.goto('/e2e/pages/carousel.html?variant=three-per-view', { waitUntil: 'load' })
  await page.getByRole('region', { name: 'Featured products' }).waitFor()
  await screenReader.navigateToWebContent()

  for (let step = 0; step < 6; step++) {
    await screenReader.nextHeading()
  }
  const spoken = (await screenReader.spokenPhraseLog()).join(' | ')

  for (const heading of ['Product 1', 'Product 2', 'Product 3']) {
    expect(spoken).toContain(heading)
  }
})

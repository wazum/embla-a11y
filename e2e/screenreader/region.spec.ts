import { expect } from '@playwright/test'
import { screenReaderTest as test } from '@guidepup/playwright'

test('announces the carousel region and reads every visible slide', async ({
  page,
  screenReader
}) => {
  await page.goto('/e2e/pages/carousel.html?variant=three-per-view', { waitUntil: 'load' })
  await page.getByRole('region', { name: 'Featured products' }).waitFor()
  await screenReader.navigateToWebContent()

  const expectedPhrases = ['Featured products', 'Product 1', 'Product 2', 'Product 3']
  for (let step = 0; step < 30; step++) {
    await screenReader.next()
  }
  const spoken = (await screenReader.spokenPhraseLog()).join(' | ')

  for (const phrase of expectedPhrases) {
    expect(spoken).toContain(phrase)
  }
})

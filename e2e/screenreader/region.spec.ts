import { expect } from '@playwright/test'
import { screenReaderTest as test } from '@guidepup/playwright'
import { listen, nextHeading, openVariant } from './listen.js'

test('reaches every visible slide by heading navigation', async ({ page, screenReader }) => {
  await openVariant(page, screenReader, 'three-per-view')

  const heard = (await listen(screenReader, nextHeading, 6)).join(' | ')

  for (const heading of ['Product 1', 'Product 2', 'Product 3']) {
    expect(heard).toContain(heading)
  }
})

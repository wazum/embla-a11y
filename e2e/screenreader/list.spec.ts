import { expect } from '@playwright/test'
import { screenReaderTest as test } from '@guidepup/playwright'
import { listen, nextHeading, openVariant } from './listen.js'

test('counts every slide while off-screen slides are hidden', async ({ page, screenReader }) => {
  await openVariant(page, screenReader, 'three-per-view&hideOffscreen')
  await listen(screenReader, nextHeading, 2)

  const heard = (await listen(screenReader, (reader) => reader.next(), 4)).join(' | ')

  expect(heard).toMatch(/\b10\b/)
  expect(heard).not.toMatch(/\b3 items\b/)
})

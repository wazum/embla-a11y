import { expect } from '@playwright/test'
import { screenReaderTest as test } from '@guidepup/playwright'
import { openVariant } from './listen.js'

test.use({ screenReaderStartOptions: { capture: true } })
test.skip(process.platform === 'linux', 'Guidepup cannot press keys through Orca yet')

test('speaks the new position after Next', async ({ page, screenReader }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openVariant(page, screenReader, 'three-per-view')
  await page.getByRole('button', { name: 'Previous' }).focus()
  await screenReader.press('Tab')
  await expect(page.getByRole('button', { name: 'Next' })).toBeFocused()
  await screenReader.clearSpokenPhraseLog()

  await screenReader.press('Enter')

  await expect(page.locator('.embla__announcer')).toHaveText('Slides 2 to 4 of 10')
  await expect
    .poll(async () => (await screenReader.spokenPhraseLog()).join(' | '), { timeout: 10_000 })
    .toContain('Slides 2 to 4 of 10')
})

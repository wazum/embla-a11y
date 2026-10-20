import { expect, type Locator } from '@playwright/test'
import { screenReaderTest as test, type ScreenReaderPlaywright } from '@guidepup/playwright'
import { openDemoSite } from './listen.js'

test.use({
  screenReaderStartOptions: { capture: true },
  reducedMotion: 'reduce',
  permissions: ['clipboard-read', 'clipboard-write']
})
test.skip(process.platform === 'linux', 'Guidepup cannot press keys through Orca yet')

for (const { name, previous, next } of [
  { name: 'Basics', previous: 'Previous', next: 'Next' },
  { name: 'Städte in Europa', previous: 'Zurück', next: 'Weiter' }
]) {
  test(`the demo site speaks the position after ${next} in “${name}”`, async ({
    page,
    screenReader
  }) => {
    await openDemoSite(page, screenReader)
    const carousel = page.getByRole('region', { name })
    await carousel.getByRole('button', { name: previous }).focus()
    await screenReader.press('Tab')
    await expect(carousel.getByRole('button', { name: next })).toBeFocused()
    await screenReader.clearSpokenPhraseLog()

    await screenReader.press('Enter')

    const announcement = await settledText(carousel.locator('.carousel__announcer'))
    await expectSpoken(screenReader, announcement)
  })
}

test('the demo site speaks the result of copying the code', async ({ page, screenReader }) => {
  await openDemoSite(page, screenReader)
  await page.getByRole('link', { name: 'Quick start with the full markup' }).focus()
  await screenReader.press('Tab')
  await expect(page.getByRole('button', { name: 'Copy' })).toBeFocused()
  await screenReader.clearSpokenPhraseLog()

  await screenReader.press('Enter')

  await expectSpoken(screenReader, 'Code copied to clipboard')
})

async function settledText(element: Locator): Promise<string> {
  await expect(element).not.toBeEmpty()
  return (await element.textContent()) ?? ''
}

async function expectSpoken(screenReader: ScreenReaderPlaywright, text: string): Promise<void> {
  await expect
    .poll(async () => (await screenReader.spokenPhraseLog()).join(' | '), { timeout: 10_000 })
    .toContain(text)
}

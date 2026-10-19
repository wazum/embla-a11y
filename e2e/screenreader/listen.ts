import type { Page } from '@playwright/test'
import type { ScreenReaderPlaywright } from '@guidepup/playwright'

type Command = (screenReader: ScreenReaderPlaywright) => Promise<void>

export const nextHeading: Command = (screenReader) => screenReader.nextHeading()

export async function openVariant(
  page: Page,
  screenReader: ScreenReaderPlaywright,
  variant: string
): Promise<void> {
  await page.goto(`/e2e/pages/carousel.html?variant=${variant}`, { waitUntil: 'load' })
  await page.getByRole('region').waitFor()
  await screenReader.navigateToWebContent()
}

export async function listen(
  screenReader: ScreenReaderPlaywright,
  command: Command,
  times: number
): Promise<string[]> {
  const utterances: string[] = []
  for (let step = 0; step < times; step++) {
    await screenReader.clearSpokenPhraseLog()
    await command(screenReader)
    utterances.push((await settledPhrases(screenReader)).join(' '))
  }
  return utterances
}

async function settledPhrases(screenReader: ScreenReaderPlaywright): Promise<string[]> {
  let phrases = await screenReader.spokenPhraseLog()
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 250))
    const next = await screenReader.spokenPhraseLog()
    if (next.length === phrases.length && next.length > 0) return next
    phrases = next
  }
  return phrases
}

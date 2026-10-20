import { expect } from '@playwright/test'
import { screenReaderTest as test } from '@guidepup/playwright'
import { listen, nextHeading, openVariant } from './listen.js'

test.skip(process.platform === 'linux', 'Guidepup cannot steer Orca into the list reliably yet')

for (const markup of ['list', 'div']) {
  test(`counts every slide while off-screen slides are hidden (${markup} markup)`, async ({
    page,
    screenReader
  }) => {
    test.fail(
      process.platform === 'win32',
      'NVDA counts only the list items it can reach and ignores aria-setsize'
    )
    await openVariant(page, screenReader, `three-per-view&hideOffscreen&markup=${markup}`)
    for (let jump = 0; jump < 5; jump++) {
      const heading = (await listen(screenReader, nextHeading, 1)).join('')
      if (heading.includes('Featured products')) break
    }

    const heard = (await listen(screenReader, (reader) => reader.next(), 3)).join(' | ')

    expect(heard).toMatch(/\b10\b/)
    expect(heard).not.toMatch(/\b3 items\b/)
  })
}

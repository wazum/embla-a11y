import { afterEach, describe, expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { removeCarousels } from './fixture.js'

declare const USES_EMBLA_V8: boolean

const markup = import.meta.glob<string>('../examples/*.html', {
  query: '?raw',
  import: 'default',
  eager: true
})
const scripts = import.meta.glob('../examples/*.js')

afterEach(removeCarousels)

describe.skipIf(USES_EMBLA_V8)('examples', () => {
  test('quick start marks the ends and announces a move', async () => {
    await runExample('quick-start.js', 'quick-start.html')

    expect(element('.embla__prev').getAttribute('aria-disabled')).toBe('true')
    expect(element('.embla__dot').getAttribute('aria-current')).toBe('true')

    element('.embla__next').click()

    await expect
      .poll(() => element('.embla__announcer').textContent, { timeout: 3000 })
      .toBe('Slide 2 of 2')
    expect(element('.embla__next').getAttribute('aria-disabled')).toBe('true')
  })

  test('rotation starts with the host and the button stops it', async () => {
    await runExample('rotation.js', 'rotation.html')

    await expect.poll(() => element('[data-rotation-stopped]').hidden).toBe(true)
    expect(element('[data-rotation-playing]').hidden).toBe(false)

    element('.embla__rotation').click()

    expect(element('[data-rotation-stopped]').hidden).toBe(false)
    expect(element('[data-rotation-playing]').hidden).toBe(true)
  })

  test('dots built by script get names from the template', async () => {
    await runExample('dots-from-script.js', 'dots-from-script.html')

    await expect
      .poll(() => Array.from(document.querySelectorAll('.embla__dot'), (dot) => dot.textContent))
      .toEqual(['Slide 1', 'Slide 2', 'Slide 3'])

    elements('.embla__dot')[2]?.click()

    await expect
      .poll(() => element('.embla__announcer').textContent, { timeout: 3000 })
      .toBe('Slide 3 of 3')
  })

  test('switching off on wide screens takes everything back', async () => {
    await page.viewport(1000, 600)
    await runExample('switch-off.js', 'quick-start.html')

    expect(element('.embla__prev').hasAttribute('aria-disabled')).toBe(false)

    await page.viewport(800, 600)

    await expect.poll(() => element('.embla__prev').getAttribute('aria-disabled')).toBe('true')
  })
})

async function runExample(script: string, html: string): Promise<void> {
  const style = document.createElement('style')
  style.textContent = `
    .embla__viewport { overflow: hidden; width: 600px }
    .embla__container { display: flex; margin: 0; padding: 0; list-style: none }
    .embla__slide { flex: 0 0 100%; min-width: 0 }
  `
  document.body.innerHTML = markup[`../examples/${html}`] ?? ''
  document.body.append(style)
  await scripts[`../examples/${script}`]?.()
}

function element(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector)
  if (found === null) throw new Error(`${selector} not found`)
  return found
}

function elements(selector: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(selector))
}

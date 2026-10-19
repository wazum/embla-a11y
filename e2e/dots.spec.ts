import { expect, test } from '@playwright/test'

test('names each dot after the slide it shows', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=one-per-view')

  for (let slide = 1; slide <= 10; slide++) {
    await expect(
      page.getByRole('button', { name: `Go to slide ${slide}`, exact: true })
    ).toBeVisible()
  }
})

test('names dots with page text that browser translation can reach', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=one-per-view')
  const firstDot = page.getByRole('button', { name: 'Go to slide 1', exact: true })

  await expect(firstDot).toHaveText('Go to slide 1')
  await expect(firstDot).not.toHaveAttribute('aria-label')
})

test('names each dot after the group of slides it shows', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=grouped')

  await expect(page.getByRole('button', { name: 'Go to slides 1 to 3' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Go to slides 4 to 6' })).toBeVisible()
})

test('marks the dot of the shown slide as current', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=one-per-view')
  const firstDot = page.getByRole('button', { name: 'Go to slide 1', exact: true })
  const secondDot = page.getByRole('button', { name: 'Go to slide 2', exact: true })

  await expect(firstDot).toHaveAttribute('aria-current', 'true')
  await expect(secondDot).not.toHaveAttribute('aria-current')

  await page.getByRole('button', { name: 'Next' }).click()

  await expect(secondDot).toHaveAttribute('aria-current', 'true')
  await expect(firstDot).not.toHaveAttribute('aria-current')
})

test('keeps the current dot available', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=one-per-view')

  await expect(
    page.getByRole('button', { name: 'Go to slide 1', exact: true, disabled: false })
  ).toBeVisible()
})

test('names dots that are rebuilt after the carousel started', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=one-per-view')

  await page.evaluate(() => {
    const dots = document.querySelector('.embla__dots')
    const rebuilt = Array.from(dots?.children ?? [], () => {
      const dot = document.createElement('button')
      dot.type = 'button'
      return dot
    })
    dots?.replaceChildren(...rebuilt)
  })

  await expect(page.getByRole('button', { name: 'Go to slide 1', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Go to slide 1', exact: true })).toHaveAttribute(
    'aria-current',
    'true'
  )
})

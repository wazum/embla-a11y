import { expect, test } from '@playwright/test'

test('reports Previous as unavailable at the start', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=one-per-view')

  await expect(page.getByRole('button', { name: 'Previous', disabled: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Next', disabled: false })).toBeVisible()
})

test('keeps focus on Next when the keyboard reaches the end', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=one-per-view')
  const next = page.getByRole('button', { name: 'Next' })
  await next.focus()

  for (let step = 0; step < 9; step++) {
    await page.keyboard.press('Enter')
  }

  await expect(page.getByRole('button', { name: 'Next', disabled: true })).toBeVisible()
  await expect(next).toBeFocused()
})

test('never reports a button as unavailable in a loop', async ({ page }) => {
  await page.goto('/e2e/pages/carousel.html?variant=loop')
  const previous = page.getByRole('button', { name: 'Previous' })
  await previous.focus()

  await page.keyboard.press('Enter')

  await expect(page.getByRole('button', { name: 'Previous', disabled: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Next', disabled: false })).toBeVisible()
})

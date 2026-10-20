import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import emblaA11y from '../src/index.js'
import { createCarousel, removeCarousels } from './fixture.js'

afterEach(removeCarousels)

test('leaves the slidefocus event to later listeners when Tab lands in an off-screen slide', async () => {
  const { slides, emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [emblaA11y({ label: 'Products', hideOffscreen: false })]
  })
  const laterListener = vi.fn<() => void>()
  emblaApi.on('slidefocus', laterListener)
  slides[0]?.querySelector('a')?.focus()

  await userEvent.tab()

  expect(document.activeElement).toBe(slides[1]?.querySelector('a'))
  expect(laterListener).toHaveBeenCalledOnce()
})

test('brings a clipped link fully into view when focus comes back from an iframe', async () => {
  const { slides } = createCarousel({
    slideCount: 3,
    slideWidth: '60%',
    plugins: [emblaA11y({ label: 'Products' })]
  })
  const iframe = document.createElement('iframe')
  iframe.srcdoc = '<button>Play video</button>'
  slides[0]?.append(iframe)
  await new Promise((resolve) => iframe.addEventListener('load', resolve, { once: true }))
  const link = slides[1]?.querySelector('a')
  if (link === null || link === undefined) throw new Error('link not found')
  link.style.marginLeft = '500px'

  iframe.focus()
  await new Promise((resolve) => setTimeout(resolve, 50))
  link.focus()

  await expect.poll(() => link.getBoundingClientRect().right).toBeLessThanOrEqual(1000)
})

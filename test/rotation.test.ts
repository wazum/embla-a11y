import Autoplay from 'embla-carousel-autoplay'
import { afterEach, expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import emblaA11y from '../src/index.js'
import { createCarousel, removeCarousels, stageControl } from './fixture.js'

afterEach(() => {
  removeCarousels()
  vi.restoreAllMocks()
})

function createRotationButton(html: string): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.innerHTML = html
  return stageControl(button)
}

test('takes the rotation button texts from the markup', async () => {
  const rotationButton = createRotationButton(
    '<span data-rotation-playing>Rotation stoppen</span><span data-rotation-stopped hidden>Rotation starten</span>'
  )
  const { emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [Autoplay({ delay: 1000 }), emblaA11y({ label: 'Products', rotationButton })]
  })
  emblaApi.plugins().autoplay?.play()

  await expect.element(page.getByRole('button', { name: 'Rotation stoppen' })).toBeVisible()

  await page.getByRole('button', { name: 'Rotation stoppen' }).click()

  await expect.element(page.getByRole('button', { name: 'Rotation starten' })).toBeVisible()
})

test('names the rotation button with rotationLabel and gives its text back on destroy', async () => {
  const rotationButton = createRotationButton('Pause')
  const { emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [
      Autoplay({ delay: 1000 }),
      emblaA11y({
        label: 'Products',
        rotationButton,
        rotationLabel: (playing) => (playing ? 'Rotation stoppen' : 'Rotation starten')
      })
    ]
  })
  emblaApi.plugins().autoplay?.play()

  await expect.element(page.getByRole('button', { name: 'Rotation stoppen' })).toBeVisible()

  await page.getByRole('button', { name: 'Rotation stoppen' }).click()

  await expect.element(page.getByRole('button', { name: 'Rotation starten' })).toBeVisible()

  emblaApi.destroy()

  expect(rotationButton.textContent).toBe('Pause')
})

test('writes rotationLabel into the element marked with data-rotation-label', async () => {
  const rotationButton = createRotationButton(
    '<svg aria-hidden="true"></svg><span data-rotation-label>Pause</span>'
  )
  const { emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [
      Autoplay({ delay: 1000 }),
      emblaA11y({
        label: 'Products',
        rotationButton,
        rotationLabel: (playing) => (playing ? 'Rotation stoppen' : 'Rotation starten')
      })
    ]
  })
  emblaApi.plugins().autoplay?.play()

  await expect.element(page.getByRole('button', { name: 'Rotation stoppen' })).toBeVisible()
  expect(rotationButton.querySelector('svg')).not.toBeNull()
})

test('keeps the markup texts of the rotation button on destroy', () => {
  const rotationButton = createRotationButton(
    '<span data-rotation-playing>Rotation stoppen</span><span data-rotation-stopped hidden>Rotation starten</span>'
  )
  const { emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [
      Autoplay({ delay: 1000 }),
      emblaA11y({ label: 'Products', rotationButton, rotationLabel: () => 'Ignoriert' })
    ]
  })

  emblaApi.destroy()

  expect(rotationButton.querySelector('[data-rotation-playing]')?.textContent).toBe(
    'Rotation stoppen'
  )
  expect(rotationButton.querySelector('[data-rotation-stopped]')?.textContent).toBe(
    'Rotation starten'
  )
})

test('does not break when there is only one slide to rotate', async () => {
  const rotationButton = createRotationButton(
    '<span data-rotation-playing>Rotation stoppen</span><span data-rotation-stopped hidden>Rotation starten</span>'
  )
  const errors: unknown[] = []
  const onError = (event: ErrorEvent): void => {
    errors.push(event.error)
  }
  window.addEventListener('error', onError)
  createCarousel({
    slideCount: 1,
    slideWidth: '100%',
    plugins: [Autoplay({ delay: 1000 }), emblaA11y({ label: 'Products', rotationButton })]
  })

  rotationButton.click()
  await new Promise((resolve) => setTimeout(resolve, 50))
  window.removeEventListener('error', onError)

  expect(errors).toEqual([])
})

test('leaves a rotation button without texts alone and warns', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const rotationButton = createRotationButton('Pause')
  const { emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [Autoplay({ delay: 1000 }), emblaA11y({ label: 'Products', rotationButton })]
  })
  emblaApi.plugins().autoplay?.play()
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(rotationButton.textContent).toBe('Pause')
  expect(warn).toHaveBeenCalledOnce()
})

test('warns once when Autoplay runs without a rotation button, also after a reInit', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const { emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [Autoplay({ delay: 1000 }), emblaA11y({ label: 'Products' })]
  })
  await new Promise((resolve) => setTimeout(resolve, 50))

  emblaApi.reInit()
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(warn).toHaveBeenCalledOnce()
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('without a rotation button'))
})

test('stops for good on a press on Next outside an extra wrapper around the viewport', async () => {
  const { buttons, emblaApi } = createCarousel({
    viewportWrapper: true,
    slideCount: 3,
    slideWidth: '100%',
    plugins: ({ previous, next }) => [
      Autoplay({ delay: 1000 }),
      emblaA11y({ label: 'Products', previousButton: previous, nextButton: next })
    ]
  })
  emblaApi.plugins().autoplay?.play()
  await new Promise((resolve) => setTimeout(resolve, 50))

  await page.elementLocator(buttons.next).click()

  expect(emblaApi.plugins().autoplay?.isPlaying()).toBe(false)
})

test('keeps rotating on a press outside the viewport when the viewport has no wrapper', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const outside = createRotationButton('Elsewhere on the page')
  const { emblaApi } = createCarousel({
    wrapperTag: null,
    slideCount: 3,
    slideWidth: '100%',
    plugins: [Autoplay({ delay: 1000 }), emblaA11y({ label: 'Products' })]
  })
  emblaApi.plugins().autoplay?.play()
  await new Promise((resolve) => setTimeout(resolve, 50))

  await page.elementLocator(outside).click()

  expect(emblaApi.plugins().autoplay?.isPlaying()).toBe(true)
})

test('marks a rotation button without Autoplay or AutoScroll unavailable and warns', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const rotationButton = createRotationButton(
    '<span data-rotation-playing>Stop slide rotation</span><span data-rotation-stopped hidden>Start slide rotation</span>'
  )
  const { emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [emblaA11y({ label: 'Products', rotationButton })]
  })
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(rotationButton.getAttribute('aria-disabled')).toBe('true')
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('no Autoplay or AutoScroll'))

  emblaApi.destroy()

  expect(rotationButton.hasAttribute('aria-disabled')).toBe(false)
})

test('marks the rotation button unavailable while there is only one snap', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const rotationButton = createRotationButton(
    '<span data-rotation-playing>Stop slide rotation</span><span data-rotation-stopped hidden>Start slide rotation</span>'
  )
  createCarousel({
    slideCount: 1,
    slideWidth: '100%',
    plugins: [Autoplay({ delay: 1000 }), emblaA11y({ label: 'Products', rotationButton })]
  })
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(rotationButton.getAttribute('aria-disabled')).toBe('true')
  expect(warn).not.toHaveBeenCalled()
})

test('leaves the rotation button available when the carousel can rotate', async () => {
  const rotationButton = createRotationButton(
    '<span data-rotation-playing>Stop slide rotation</span><span data-rotation-stopped hidden>Start slide rotation</span>'
  )
  const { emblaApi } = createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [Autoplay({ delay: 1000 }), emblaA11y({ label: 'Products', rotationButton })]
  })
  emblaApi.plugins().autoplay?.play()
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(rotationButton.hasAttribute('aria-disabled')).toBe(false)
})

test('does not warn about a missing rotation button when there is one', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const rotationButton = createRotationButton(
    '<span data-rotation-playing>Rotation stoppen</span><span data-rotation-stopped hidden>Rotation starten</span>'
  )
  createCarousel({
    slideCount: 3,
    slideWidth: '100%',
    plugins: [Autoplay({ delay: 1000 }), emblaA11y({ label: 'Products', rotationButton })]
  })
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(warn).not.toHaveBeenCalled()
})

test('does not warn about a missing rotation button without Autoplay or AutoScroll', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  createCarousel({ slideCount: 3, slideWidth: '100%', plugins: [emblaA11y({ label: 'Products' })] })
  await new Promise((resolve) => setTimeout(resolve, 50))

  expect(warn).not.toHaveBeenCalled()
})

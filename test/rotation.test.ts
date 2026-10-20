import Autoplay from 'embla-carousel-autoplay'
import { afterEach, expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import emblaA11y from '../src/index.js'
import { createCarousel, removeCarousels } from './fixture.js'

afterEach(() => {
  removeCarousels()
  vi.restoreAllMocks()
})

function createRotationButton(html: string): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.innerHTML = html
  document.body.append(button)
  return button
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

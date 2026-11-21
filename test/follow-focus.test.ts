import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import emblaA11y from '../src/index.js'
import { createCarousel, removeCarousels, stageControl } from './fixture.js'

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

test('moves a partly visible slide only into full view, so the slide after it stays off screen', async () => {
  const { slides, emblaApi } = createCarousel({
    slideCount: 6,
    slideWidth: '40%',
    plugins: [emblaA11y({ label: 'Products' })]
  })
  slides[1]?.querySelector('a')?.focus()

  await userEvent.tab()

  const viewport = emblaApi.rootNode().getBoundingClientRect()
  expect(document.activeElement).toBe(slides[2]?.querySelector('a'))
  expect(slides[2]?.getBoundingClientRect().right).toBeCloseTo(viewport.right, 0)
  await expect.poll(() => slides[3]?.inert).toBe(true)
})

test('moves the slide peeking in on the left only into full view when Shift+Tab reaches it in a centered loop', async () => {
  const { slides, buttons, emblaApi } = createCarousel({
    slideCount: 6,
    slideWidth: '60%',
    options: { loop: true, align: 'center' },
    plugins: [emblaA11y({ label: 'Products' })]
  })
  buttons.previous.focus()

  await userEvent.tab({ shift: true })

  const viewport = emblaApi.rootNode().getBoundingClientRect()
  expect(document.activeElement).toBe(slides[5]?.querySelector('a'))
  expect(slides[5]?.getBoundingClientRect().left).toBeCloseTo(viewport.left, 0)
  await expect.poll(() => slides[4]?.inert).toBe(true)
})

test('moves a slide with a fractional width only into full view when Tab reaches it in a centered loop', async () => {
  const { slides, emblaApi } = createCarousel({
    slideCount: 6,
    slideWidth: '57.12%',
    options: { loop: true, align: 'center' },
    plugins: [emblaA11y({ label: 'Products' })]
  })
  slides[0]?.querySelector('a')?.focus()

  await userEvent.tab()

  const viewport = emblaApi.rootNode().getBoundingClientRect()
  expect(document.activeElement).toBe(slides[1]?.querySelector('a'))
  expect(slides[1]?.getBoundingClientRect().right).toBeCloseTo(viewport.right, 0)
  await expect.poll(() => slides[2]?.inert).toBe(true)
})

for (const direction of ['ltr', 'rtl'] as const) {
  test(`shows what the browser scrolls to without focus, such as find in page, ${direction}`, async () => {
    const { slides, emblaApi } = createCarousel({
      slideCount: 6,
      slideWidth: '50%',
      options: { direction },
      wrapperAttributes: { dir: direction },
      plugins: [emblaA11y({ label: 'Products' })]
    })
    const target = slides[4]
    if (target === undefined) throw new Error('slide not found')
    const viewport = emblaApi.rootNode()

    target.scrollIntoView({ block: 'nearest', inline: 'nearest' })

    await expect.poll(() => viewport.scrollLeft).toBe(0)
    await expect
      .poll(() => target.getBoundingClientRect().left)
      .toBeGreaterThanOrEqual(viewport.getBoundingClientRect().left)
    expect(target.getBoundingClientRect().right).toBeLessThanOrEqual(
      viewport.getBoundingClientRect().right
    )
    await expect.poll(() => target.inert).toBe(false)
  })
}

// Started before the scroll event, the plugin's scroll listener would take the offset over.
async function scrollNatively(viewport: HTMLElement, offset: number): Promise<void> {
  const scrolled = new Promise((resolve) =>
    viewport.addEventListener('scroll', resolve, { once: true })
  )
  viewport.scrollLeft = offset
  await scrolled
}

for (const direction of ['ltr', 'rtl'] as const) {
  const slideWidth = direction === 'rtl' ? -500 : 500
  const createScrollableCarousel = (): ReturnType<typeof createCarousel> =>
    createCarousel({
      slideCount: 6,
      slideWidth: '50%',
      options: { direction, align: 'start' },
      wrapperAttributes: { dir: direction }
    })

  test(`takes over a scroll offset the viewport already has when the plugin starts, ${direction}`, async () => {
    const { slides, emblaApi } = createScrollableCarousel()
    const target = slides[2]
    if (target === undefined) throw new Error('slide not found')
    const viewport = emblaApi.rootNode()
    await scrollNatively(viewport, 2 * slideWidth)
    const shownAt = target.getBoundingClientRect().left

    emblaApi.reInit(undefined, [emblaA11y({ label: 'Products' })])

    expect(viewport.scrollLeft).toBe(0)
    expect(target.getBoundingClientRect().left).toBeCloseTo(shownAt, 0)
    expect(emblaApi.canGoToPrev()).toBe(true)
    expect(target.inert).toBe(false)
  })

  test(`goes back to the first stop from a start offset of a quarter slide, ${direction}`, async () => {
    const { slides, emblaApi } = createScrollableCarousel()
    const viewport = emblaApi.rootNode()
    const startEdge = direction === 'rtl' ? 'right' : 'left'
    await scrollNatively(viewport, slideWidth / 4)

    emblaApi.reInit(undefined, [emblaA11y({ label: 'Products' })])

    expect(viewport.scrollLeft).toBe(0)
    expect(emblaApi.selectedSnap()).toBe(0)
    expect(slides[0]?.getBoundingClientRect()[startEdge]).toBeCloseTo(
      viewport.getBoundingClientRect()[startEdge],
      0
    )
    expect(emblaApi.canGoToPrev()).toBe(false)
  })

  test(`goes on to the second stop from a start offset of three quarters of a slide, ${direction}`, async () => {
    const { slides, emblaApi } = createScrollableCarousel()
    const viewport = emblaApi.rootNode()
    const startEdge = direction === 'rtl' ? 'right' : 'left'
    await scrollNatively(viewport, (slideWidth * 3) / 4)

    emblaApi.reInit(undefined, [emblaA11y({ label: 'Products' })])

    expect(emblaApi.selectedSnap()).toBe(1)
    expect(slides[1]?.getBoundingClientRect()[startEdge]).toBeCloseTo(
      viewport.getBoundingClientRect()[startEdge],
      0
    )
    expect(emblaApi.canGoToPrev()).toBe(true)
  })

  test(`lands on the last stop when the viewport starts scrolled to its end, ${direction}`, async () => {
    const { emblaApi } = createScrollableCarousel()
    const viewport = emblaApi.rootNode()
    await scrollNatively(viewport, 6 * slideWidth)

    emblaApi.reInit(undefined, [emblaA11y({ label: 'Products' })])

    expect(viewport.scrollLeft).toBe(0)
    expect(emblaApi.selectedSnap()).toBe(emblaApi.snapList().length - 1)
    expect(emblaApi.canGoToNext()).toBe(false)
  })

  test(`announces nothing when it takes over a start offset, ${direction}`, async () => {
    const announcer = stageControl(document.createElement('p'))
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('data-announcement', 'Slide {first} of {total}')
    const { buttons, emblaApi } = createScrollableCarousel()
    await scrollNatively(emblaApi.rootNode(), 2 * slideWidth)

    emblaApi.reInit(undefined, [
      emblaA11y({
        label: 'Products',
        previousButton: buttons.previous,
        nextButton: buttons.next,
        announcer
      })
    ])
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(emblaApi.selectedSnap()).toBe(2)
    expect(announcer.textContent).toBe('')
  })

  test(`moves nothing when the viewport starts without a scroll offset, ${direction}`, async () => {
    const { emblaApi } = createScrollableCarousel()
    const onMove = vi.fn<() => void>()
    emblaApi.on('scroll', onMove)
    emblaApi.on('select', onMove)
    const targetBefore = emblaApi.internalEngine().target.get()

    emblaApi.reInit(undefined, [emblaA11y({ label: 'Products' })])
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(onMove).not.toHaveBeenCalled()
    expect(emblaApi.internalEngine().target.get()).toBe(targetBefore)
  })
}

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

import type { EmblaCarouselType } from 'embla-carousel'
import type { Feature } from './Feature.js'

/**
 * Moves the carousel just far enough to show the slide that got focus in full, and never to the slide's snap,
 * so the slide after it does not peek in and Tab stays with the slides on screen.
 * It follows keyboard, screen reader and script focus, but not mouse or touch presses or focus the browser restores.
 * It also undoes the browser's own scrolling of the viewport, and moves the carousel to what the browser scrolled to
 * without focus, as find in page or a link to a slide do.
 */
export class FollowFocus implements Feature {
  private readonly emblaApi: EmblaCarouselType
  private readonly onFocusIn = (event: FocusEvent): void => this.follow(event.target)
  private readonly onPointerDown = (event: PointerEvent): void => {
    this.pressed = event.target instanceof Node ? event.target : null
  }
  private readonly onKeyDown = (): void => {
    this.pressed = null
  }
  private readonly onSlideFocus = (): boolean => {
    this.resetNativeScroll()
    const focused = document.activeElement
    if (!(focused instanceof Element)) return true
    const box = this.boxOf(focused)
    const clipped = this.overflow(box)
    if (clipped === 0) return false
    // Embla jumps to the snap next; follow() corrects it to this.
    this.wantedStart = this.startOf(box) - clipped
    return true
  }
  private readonly onNativeScroll = (): void => {
    const root = this.emblaApi.rootNode()
    const distance =
      this.emblaApi.internalEngine().axis.scroll === 'x' ? root.scrollLeft : root.scrollTop
    this.resetNativeScroll()
    if (distance !== 0) this.moveBy(-distance)
  }
  private readonly onWindowBlur = (): void => {
    this.windowWasLeft = true
  }
  private readonly onWindowFocus = (): void => {
    clearTimeout(this.restoreTimeout)
    this.restoreTimeout = setTimeout(() => {
      this.windowWasLeft = false
    })
  }
  private windowWasLeft = false
  private pressed: Node | null = null
  private wantedStart: number | null = null
  private restoreTimeout: ReturnType<typeof setTimeout> | undefined

  public constructor(emblaApi: EmblaCarouselType) {
    this.emblaApi = emblaApi
    emblaApi.rootNode().addEventListener('focusin', this.onFocusIn)
    emblaApi.rootNode().addEventListener('pointerdown', this.onPointerDown, true)
    emblaApi.rootNode().addEventListener('scroll', this.onNativeScroll)
    window.addEventListener('keydown', this.onKeyDown, true)
    emblaApi.on('slidefocus', this.onSlideFocus)
    window.addEventListener('blur', this.onWindowBlur)
    window.addEventListener('focus', this.onWindowFocus)
  }

  public destroy(): void {
    clearTimeout(this.restoreTimeout)
    this.emblaApi.rootNode().removeEventListener('focusin', this.onFocusIn)
    this.emblaApi.rootNode().removeEventListener('pointerdown', this.onPointerDown, true)
    this.emblaApi.rootNode().removeEventListener('scroll', this.onNativeScroll)
    window.removeEventListener('keydown', this.onKeyDown, true)
    this.emblaApi.off('slidefocus', this.onSlideFocus)
    window.removeEventListener('blur', this.onWindowBlur)
    window.removeEventListener('focus', this.onWindowFocus)
  }

  private follow(target: EventTarget | null): void {
    this.resetNativeScroll()

    const wantedStart = this.wantedStart
    const restoredByBrowser = this.windowWasLeft
    const pressed = this.pressed
    this.wantedStart = null
    this.windowWasLeft = false
    this.pressed = null
    if (restoredByBrowser || !(target instanceof Element)) return
    if (pressed !== null && target.contains(pressed)) return

    const box = this.boxOf(target)
    const start = wantedStart ?? this.startOf(box) - this.overflow(box)
    const distance = start - this.startOf(box)
    if (distance !== 0) this.moveBy(distance)
    // Under Fade only the snap shows the slide.
    if (this.overflow(box) !== 0) this.goToSlideOf(target)
    // A wide button can stick out of its slide.
    const clipped = this.overflow(target)
    if (clipped !== 0) this.moveBy(-clipped)
  }

  private goToSlideOf(target: Element): void {
    const slideIndex = this.emblaApi.slideNodes().findIndex((slide) => slide.contains(target))
    const snapIndex = this.emblaApi.internalEngine().scrollSnapList.snapBySlide[slideIndex]
    if (snapIndex !== undefined) this.emblaApi.goTo(snapIndex, true)
  }

  private resetNativeScroll(): void {
    const root = this.emblaApi.rootNode()
    root.scrollLeft = 0
    root.scrollTop = 0
  }

  private boxOf(target: Element): Element {
    const slide = this.emblaApi.slideNodes().find((candidate) => candidate.contains(target))
    if (slide === undefined) return target
    const [start, end] = this.edges()
    const inner = slide.getBoundingClientRect()
    const outer = this.emblaApi.rootNode().getBoundingClientRect()
    return inner[end] - inner[start] <= outer[end] - outer[start] ? slide : target
  }

  private startOf(element: Element): number {
    return element.getBoundingClientRect()[this.edges()[0]]
  }

  private moveBy(distance: number): void {
    const engine = this.emblaApi.internalEngine()
    const current = engine.target.get()
    const wanted = current + engine.axis.direction(distance)
    // Past the limit, an instant move never settles.
    const reachable = engine.options.loop
      ? wanted
      : Math.min(Math.max(wanted, engine.limit.min), engine.limit.max)
    engine.scrollBody.useBaseFriction().useDuration(0)
    engine.scrollTo.distance(reachable - current, false)
  }

  private overflow(element: Element): number {
    const inner = element.getBoundingClientRect()
    const outer = this.emblaApi.rootNode().getBoundingClientRect()
    const [start, end] = this.edges()
    // Slides with fractional widths stop a fraction of a pixel off the edge.
    if (inner[start] < outer[start] - 1) return inner[start] - outer[start]
    if (inner[end] > outer[end] + 1) return inner[end] - outer[end]
    return 0
  }

  private edges(): readonly ['left', 'right'] | readonly ['top', 'bottom'] {
    return this.emblaApi.internalEngine().axis.scroll === 'x'
      ? (['left', 'right'] as const)
      : (['top', 'bottom'] as const)
  }
}

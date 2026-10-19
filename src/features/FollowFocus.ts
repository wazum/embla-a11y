import type { EmblaCarouselType } from 'embla-carousel'
import type { Feature } from './Feature.js'

/**
 * Moves the carousel until the focused element inside a slide is fully visible.
 * It follows keyboard, screen reader and script focus, but not mouse or touch presses or focus the browser restores.
 * It also undoes the browser's own scrolling of the viewport.
 */
export class FollowFocus implements Feature {
  private readonly emblaApi: EmblaCarouselType
  private readonly onFocusIn = (event: FocusEvent): void => this.follow(event.target)
  private readonly onSlideFocus = (): boolean => {
    const focused = document.activeElement
    return !(focused instanceof Element && this.overflow(focused) === 0)
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
  private restoreTimeout: ReturnType<typeof setTimeout> | undefined

  public constructor(emblaApi: EmblaCarouselType) {
    this.emblaApi = emblaApi
    emblaApi.rootNode().addEventListener('focusin', this.onFocusIn)
    emblaApi.on('slidefocus', this.onSlideFocus)
    window.addEventListener('blur', this.onWindowBlur)
    window.addEventListener('focus', this.onWindowFocus)
  }

  public destroy(): void {
    clearTimeout(this.restoreTimeout)
    this.emblaApi.rootNode().removeEventListener('focusin', this.onFocusIn)
    this.emblaApi.off('slidefocus', this.onSlideFocus)
    window.removeEventListener('blur', this.onWindowBlur)
    window.removeEventListener('focus', this.onWindowFocus)
  }

  private follow(target: EventTarget | null): void {
    const root = this.emblaApi.rootNode()
    root.scrollLeft = 0
    root.scrollTop = 0

    const restoredByBrowser = this.windowWasLeft
    this.windowWasLeft = false
    if (restoredByBrowser) return
    if (!(target instanceof Element) || !target.matches(':focus-visible')) return
    if (this.overflow(target) === 0) return
    this.goToSlideOf(target)

    const clipped = this.overflow(target)
    if (clipped !== 0) this.moveBy(-clipped)
  }

  private goToSlideOf(target: Element): void {
    const slideIndex = this.emblaApi.slideNodes().findIndex((slide) => slide.contains(target))
    const snapIndex = this.emblaApi.internalEngine().scrollSnapList.snapBySlide[slideIndex]
    if (snapIndex !== undefined) this.emblaApi.goTo(snapIndex, true)
  }

  private moveBy(distance: number): void {
    const engine = this.emblaApi.internalEngine()
    engine.scrollBody.useBaseFriction().useDuration(0)
    engine.scrollTo.distance(engine.axis.direction(distance), false)
  }

  private overflow(element: Element): number {
    const inner = element.getBoundingClientRect()
    const outer = this.emblaApi.rootNode().getBoundingClientRect()
    const [start, end] =
      this.emblaApi.internalEngine().axis.scroll === 'x'
        ? (['left', 'right'] as const)
        : (['top', 'bottom'] as const)
    if (inner[start] < outer[start]) return inner[start] - outer[start]
    if (inner[end] > outer[end]) return inner[end] - outer[end]
    return 0
  }
}

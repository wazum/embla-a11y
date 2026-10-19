import type { EmblaCarouselType } from 'embla-carousel'
import type { Feature } from './Feature.js'

export class FollowFocus implements Feature {
  private readonly emblaApi: EmblaCarouselType
  private readonly onFocusIn = (event: FocusEvent): void => this.follow(event.target)

  public constructor(emblaApi: EmblaCarouselType) {
    this.emblaApi = emblaApi
    emblaApi.rootNode().addEventListener('focusin', this.onFocusIn)
  }

  public destroy(): void {
    this.emblaApi.rootNode().removeEventListener('focusin', this.onFocusIn)
  }

  private follow(target: EventTarget | null): void {
    const root = this.emblaApi.rootNode()
    root.scrollLeft = 0
    root.scrollTop = 0

    if (!(target instanceof Element) || this.overflow(target) === 0) return
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

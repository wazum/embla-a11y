import type { EmblaCarouselType } from 'embla-carousel'
import { AttributeStore } from '../AttributeStore.js'
import { isOnScreen } from '../visibleSlides.js'
import type { Feature } from './Feature.js'

/**
 * Makes slides inert when they are completely outside the viewport and the carousel has stopped.
 * A slide comes back as soon as any part of it is on screen.
 * The slide that holds focus is never inert.
 */
export class HideOffscreen implements Feature {
  private readonly emblaApi: EmblaCarouselType
  private readonly attributes = new AttributeStore()
  private readonly onScroll = (): void => {
    this.moving = true
    this.showVisibleSlides()
  }
  private readonly onSettle = (): void => {
    this.moving = false
    this.update()
  }
  private readonly onFocusOut = (event: FocusEvent): void =>
    this.refresh(event.relatedTarget instanceof Element ? event.relatedTarget : null)
  private readonly scheduleRefresh = (): void => {
    cancelAnimationFrame(this.pendingFrame)
    this.pendingFrame = requestAnimationFrame(() => this.refresh())
  }
  private pendingFrame = 0
  private moving = false

  public constructor(emblaApi: EmblaCarouselType) {
    this.emblaApi = emblaApi
    this.update()
    emblaApi.on('scroll', this.onScroll)
    emblaApi.on('settle', this.onSettle)
    emblaApi.on('select', this.scheduleRefresh)
    emblaApi.rootNode().addEventListener('focusout', this.onFocusOut)
  }

  public destroy(): void {
    cancelAnimationFrame(this.pendingFrame)
    this.emblaApi.off('scroll', this.onScroll)
    this.emblaApi.off('settle', this.onSettle)
    this.emblaApi.off('select', this.scheduleRefresh)
    this.emblaApi.rootNode().removeEventListener('focusout', this.onFocusOut)
    this.attributes.restore()
  }

  private refresh(focused: Element | null = document.activeElement): void {
    if (this.moving) this.showVisibleSlides()
    else this.update(focused)
  }

  private update(focused: Element | null = document.activeElement): void {
    for (const slide of this.emblaApi.slideNodes()) {
      if (this.isVisible(slide) || slide.contains(focused)) {
        this.attributes.reset(slide, 'inert')
      } else {
        this.attributes.set(slide, 'inert', '')
      }
    }
  }

  private showVisibleSlides(): void {
    for (const slide of this.emblaApi.slideNodes()) {
      if (this.isVisible(slide)) this.attributes.reset(slide, 'inert')
    }
  }

  private isVisible(slide: HTMLElement): boolean {
    return isOnScreen(slide, this.emblaApi.rootNode())
  }
}

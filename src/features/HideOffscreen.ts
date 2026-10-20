import type { EmblaCarouselType } from 'embla-carousel'
import { AttributeStore } from '../AttributeStore.js'
import { slidesOnScreen } from '../visibleSlides.js'
import type { Feature } from './Feature.js'

/**
 * Makes slides inert when they are completely outside the viewport and the carousel has stopped, except the one with focus.
 * A slide comes back as soon as any part of it is on screen.
 * List items keep their position and the full count, so screen readers don't count only the visible ones.
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
  private readonly onFocusOut = (event: FocusEvent): void => {
    if (event.relatedTarget instanceof Element) this.refresh(event.relatedTarget)
    else this.scheduleRefresh()
  }
  private readonly scheduleRefresh = (): void => {
    cancelAnimationFrame(this.pendingFrame)
    this.pendingFrame = requestAnimationFrame(() => this.refresh())
  }
  private pendingFrame = 0
  private moving = false

  public constructor(emblaApi: EmblaCarouselType) {
    this.emblaApi = emblaApi
    this.keepListCount()
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

  private keepListCount(): void {
    const slides = this.emblaApi.slideNodes()
    slides.forEach((slide, index) => {
      if (!slide.matches('li:not([role]), [role="listitem"]')) return
      if (slide.hasAttribute('aria-setsize')) return
      this.attributes.set(slide, 'aria-posinset', String(index + 1))
      this.attributes.set(slide, 'aria-setsize', String(slides.length))
    })
  }

  private refresh(focused: Element | null = document.activeElement): void {
    if (this.moving) this.showVisibleSlides()
    else this.update(focused)
  }

  private update(focused: Element | null = document.activeElement): void {
    const slides = this.emblaApi.slideNodes()
    const visible = slidesOnScreen(slides, this.emblaApi.rootNode())
    slides.forEach((slide, index) => {
      if (visible[index] === true || slide.contains(focused)) {
        this.attributes.reset(slide, 'inert')
      } else {
        this.attributes.set(slide, 'inert', '')
      }
    })
  }

  private showVisibleSlides(): void {
    const slides = this.emblaApi.slideNodes()
    const visible = slidesOnScreen(slides, this.emblaApi.rootNode())
    slides.forEach((slide, index) => {
      if (visible[index] === true) this.attributes.reset(slide, 'inert')
    })
  }
}

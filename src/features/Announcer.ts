import type { EmblaCarouselType } from 'embla-carousel'
import { isOnScreen } from '../visibleSlides.js'
import type { Feature, WarnType } from './Feature.js'

export type AnnouncementType = (
  firstSlide: number,
  lastSlide: number,
  totalSlides: number
) => string

export type AnnouncerOptionsType = {
  announcement: AnnouncementType | null
  previousButton: HTMLElement | null
  nextButton: HTMLElement | null
  dots: HTMLElement | null
}

/**
 * Writes the position of the slides on screen into the author's live region, once, after a user moved the carousel with a button, a dot or a drag.
 * The text comes from the data-announcement templates in the markup or the announcement option. Autoplay, focus and resizes stay silent.
 */
export class Announcer implements Feature {
  private readonly emblaApi: EmblaCarouselType
  private readonly element: HTMLElement
  private readonly announcement: AnnouncementType | null
  private readonly controls: HTMLElement[]
  private readonly originalNodes: ChildNode[]
  private readonly onControlClick = (): void => this.markUserAction()
  private readonly onPointerDown = (): void => {
    this.dragging = true
    window.addEventListener('pointerup', this.onPointerUp)
    window.addEventListener('pointercancel', this.onPointerUp)
  }
  private readonly onPointerUp = (): void => {
    window.removeEventListener('pointerup', this.onPointerUp)
    window.removeEventListener('pointercancel', this.onPointerUp)
    setTimeout(() => {
      this.dragging = false
    })
  }
  private readonly onSelect = (): void => {
    if (!this.userAction && !this.dragging) return
    this.pending = true
    this.nextFrame(() => {
      const engine = this.emblaApi.internalEngine()
      if (engine.target.get() === engine.location.get()) this.onSettle()
    })
  }
  private readonly onSettle = (): void => {
    if (!this.pending) return
    this.pending = false
    this.announce()
  }
  private readonly frames = new Set<number>()
  private userAction = false
  private dragging = false
  private pending = false
  private written = false

  public constructor(
    emblaApi: EmblaCarouselType,
    announcer: HTMLElement,
    { announcement, previousButton, nextButton, dots }: AnnouncerOptionsType,
    warn: WarnType
  ) {
    this.emblaApi = emblaApi
    this.element = announcer
    this.announcement = announcement
    this.originalNodes = Array.from(announcer.childNodes)
    this.controls = [previousButton, nextButton, dots].filter((control) => control !== null)
    for (const control of this.controls) {
      control.addEventListener('click', this.onControlClick, true)
    }
    emblaApi.rootNode().addEventListener('pointerdown', this.onPointerDown)
    emblaApi.on('select', this.onSelect)
    emblaApi.on('settle', this.onSettle)
    if (!announcer.hasAttribute('data-announcement') && announcement === null) {
      warn(
        'the announcer has no text. Add data-announcement and data-announcement-group templates to it, or pass announcement.'
      )
    }
  }

  public destroy(): void {
    for (const control of this.controls) {
      control.removeEventListener('click', this.onControlClick, true)
    }
    this.emblaApi.rootNode().removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('pointerup', this.onPointerUp)
    window.removeEventListener('pointercancel', this.onPointerUp)
    this.emblaApi.off('select', this.onSelect)
    this.emblaApi.off('settle', this.onSettle)
    for (const frame of this.frames) cancelAnimationFrame(frame)
    this.frames.clear()
    if (this.written) this.element.replaceChildren(...this.originalNodes)
  }

  private nextFrame(callback: () => void): void {
    const frame = requestAnimationFrame(() => {
      this.frames.delete(frame)
      callback()
    })
    this.frames.add(frame)
  }

  private markUserAction(): void {
    this.userAction = true
    setTimeout(() => {
      this.userAction = false
    })
  }

  private announce(): void {
    const slides = this.emblaApi.slideNodes()
    const shown = this.slidesInScreenOrder()
    const first = shown[0]
    const last = shown.at(-1)
    if (first === undefined || last === undefined) return
    const text = this.textFor(first, last, slides.length)
    if (text === null) return
    this.written = true
    if (this.element.textContent !== text) {
      this.element.textContent = text
      return
    }
    this.element.textContent = ''
    this.nextFrame(() => {
      this.element.textContent = text
    })
  }

  private slidesInScreenOrder(): number[] {
    const viewportRect = this.emblaApi.rootNode().getBoundingClientRect()
    const { axis } = this.emblaApi.internalEngine()
    const readingDirection = axis.direction(1)
    return this.emblaApi
      .slideNodes()
      .flatMap((slide, index) => {
        const rect = slide.getBoundingClientRect()
        if (!isOnScreen(rect, viewportRect)) return []
        return [{ number: index + 1, start: axis.scroll === 'x' ? rect.left : rect.top }]
      })
      .toSorted((a, b) => (a.start - b.start) * readingDirection)
      .map(({ number }) => number)
  }

  private textFor(first: number, last: number, total: number): string | null {
    const single = this.element.getAttribute('data-announcement')
    const group = this.element.getAttribute('data-announcement-group') ?? single
    const template = first === last ? single : group
    if (template === null) return this.announcement?.(first, last, total) ?? null
    return template
      .replaceAll('{first}', String(first))
      .replaceAll('{last}', String(last))
      .replaceAll('{total}', String(total))
  }
}

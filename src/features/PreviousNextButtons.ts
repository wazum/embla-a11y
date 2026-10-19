import type { EmblaCarouselType } from 'embla-carousel'
import { AttributeStore } from '../AttributeStore.js'
import type { Feature } from './Feature.js'

export type PreviousNextButtonsType = {
  previousButton: HTMLElement | null
  nextButton: HTMLElement | null
}

/**
 * Marks the previous or next button with aria-disabled when the carousel cannot move that way.
 * The button keeps its focus and its place in the Tab order.
 */
export class PreviousNextButtons implements Feature {
  private readonly emblaApi: EmblaCarouselType
  private readonly buttons: PreviousNextButtonsType
  private readonly attributes = new AttributeStore()
  private readonly onSelect = (): void => this.update()

  public constructor(emblaApi: EmblaCarouselType, buttons: PreviousNextButtonsType) {
    this.emblaApi = emblaApi
    this.buttons = buttons
    this.update()
    emblaApi.on('select', this.onSelect)
  }

  public destroy(): void {
    this.emblaApi.off('select', this.onSelect)
    this.attributes.restore()
  }

  private update(): void {
    this.markUnavailable(this.buttons.previousButton, !this.emblaApi.canGoToPrev())
    this.markUnavailable(this.buttons.nextButton, !this.emblaApi.canGoToNext())
  }

  private markUnavailable(button: HTMLElement | null, unavailable: boolean): void {
    if (button === null) return
    if (unavailable) this.attributes.set(button, 'aria-disabled', 'true')
    else this.attributes.reset(button, 'aria-disabled')
  }
}

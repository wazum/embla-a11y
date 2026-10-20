import type { EmblaCarouselType } from 'embla-carousel'
import { AttributeStore } from '../AttributeStore.js'
import type { Feature } from './Feature.js'

export class SingleView implements Feature {
  private readonly attributes = new AttributeStore()

  public constructor(emblaApi: EmblaCarouselType, area: HTMLElement) {
    if (emblaApi.snapList().length <= 1) this.attributes.set(area, 'data-single-view', '')
  }

  public destroy(): void {
    this.attributes.restore()
  }
}

import type { EmblaCarouselType } from 'embla-carousel'
import { AttributeStore } from '../AttributeStore.js'
import type { Feature, WarnType } from './Feature.js'

export class SlideList implements Feature {
  private readonly attributes = new AttributeStore()

  public constructor(emblaApi: EmblaCarouselType, warn: WarnType) {
    const container = emblaApi.containerNode()
    const slides = emblaApi.slideNodes()
    if (isList(container) || slides.every((slide) => slide.hasAttribute('role'))) return
    if (!isGeneric(container) || !slides.every(isGeneric)) {
      warn(
        'the slides are not a list, so screen readers cannot say how many there are or where each one is. Use a <ul> with <li> slides, or <div> elements, which the plugin turns into a list.'
      )
      return
    }
    this.attributes.set(container, 'role', 'list')
    for (const slide of slides) this.attributes.set(slide, 'role', 'listitem')
  }

  public destroy(): void {
    this.attributes.restore()
  }
}

function isList(element: Element): boolean {
  return (
    element.localName === 'ul' ||
    element.localName === 'ol' ||
    element.getAttribute('role') === 'list'
  )
}

function isGeneric(element: Element): boolean {
  return element.localName === 'div' && !element.hasAttribute('role')
}

import type { EmblaOptionsType } from 'embla-carousel'

export type Variant = {
  name: string
  description: string
  slides: number
  perView: number
  options: EmblaOptionsType
}

export const variants: Variant[] = [
  {
    name: 'single-slide',
    description: 'One slide, nothing to scroll',
    slides: 1,
    perView: 1,
    options: {}
  },
  {
    name: 'fewer-than-fit',
    description: 'Three slides in a viewport for five, nothing to scroll',
    slides: 3,
    perView: 5,
    options: {}
  },
  {
    name: 'one-per-view',
    description: 'Ten slides, one per view',
    slides: 10,
    perView: 1,
    options: {}
  },
  {
    name: 'three-per-view',
    description: 'Ten slides, three per view (issue #1389)',
    slides: 10,
    perView: 3,
    options: {}
  },
  {
    name: 'peek',
    description: 'Ten slides, two and a half per view, the next slide partly visible',
    slides: 10,
    perView: 2.5,
    options: {}
  },
  {
    name: 'scroll-by-view',
    description: 'Ten slides, three per view, scrolls a full view at a time',
    slides: 10,
    perView: 3,
    options: { slidesToScroll: 'auto' }
  },
  {
    name: 'loop',
    description: 'Ten slides, three per view, loops',
    slides: 10,
    perView: 3,
    options: { loop: true }
  },
  {
    name: 'keep-snaps',
    description: 'Ten slides, three per view, keeps all snap points',
    slides: 10,
    perView: 3,
    options: { containScroll: 'keepSnaps' }
  },
  {
    name: 'drag-free',
    description: 'Ten slides, three per view, free dragging without snapping',
    slides: 10,
    perView: 3,
    options: { dragFree: true }
  },
  {
    name: 'vertical',
    description: 'Ten slides, three per view, vertical axis',
    slides: 10,
    perView: 3,
    options: { axis: 'y' }
  },
  {
    name: 'rtl',
    description: 'Ten slides, three per view, right to left',
    slides: 10,
    perView: 3,
    options: { direction: 'rtl' }
  }
]

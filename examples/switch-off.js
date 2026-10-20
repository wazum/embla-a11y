import EmblaCarousel from 'embla-carousel'
import emblaA11y from 'embla-a11y'

const viewport = document.querySelector('.embla__viewport')
const previous = document.querySelector('.embla__prev')

export const emblaApi = EmblaCarousel(viewport, {}, [
  emblaA11y({
    previousButton: previous,
    breakpoints: { '(min-width: 900px)': { active: false } }
  })
])

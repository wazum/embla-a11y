import EmblaCarousel from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'
import emblaA11y from 'embla-a11y'

const viewport = document.querySelector('.embla__viewport')
const rotationButton = document.querySelector('.embla__rotation')

const emblaApi = EmblaCarousel(
  viewport,
  { breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } } },
  [Autoplay(), emblaA11y({ rotationButton })]
)

emblaApi.plugins().autoplay.play()

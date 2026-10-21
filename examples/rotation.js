import EmblaCarousel from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'
import emblaA11y from 'embla-a11y'

const viewport = document.querySelector('.embla__viewport')
const rotationButton = document.querySelector('.embla__rotation')
const previous = document.querySelector('.embla__prev')
const next = document.querySelector('.embla__next')
const announcer = document.querySelector('.embla__announcer')

const emblaApi = EmblaCarousel(
  viewport,
  { breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } } },
  [Autoplay(), emblaA11y({ rotationButton, previousButton: previous, nextButton: next, announcer })]
)

emblaApi.plugins().autoplay.play()

previous.addEventListener('click', () => emblaApi.goToPrev())
next.addEventListener('click', () => emblaApi.goToNext())

export { emblaApi }

import EmblaCarousel from 'embla-carousel'
import emblaA11y from 'embla-a11y'

const viewport = document.querySelector('.embla__viewport')
const dots = document.querySelector('.embla__dots')
const announcer = document.querySelector('.embla__announcer')

const emblaApi = EmblaCarousel(viewport, {}, [emblaA11y({ dots, announcer })])

dots.append(
  ...emblaApi.snapList().map((_, index) => {
    const dot = document.createElement('button')
    dot.type = 'button'
    dot.className = 'embla__dot'
    dot.addEventListener('click', () => emblaApi.goTo(index))
    return dot
  })
)

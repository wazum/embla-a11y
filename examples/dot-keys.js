import EmblaCarousel from 'embla-carousel'
import emblaA11y from 'embla-a11y'

const viewport = document.querySelector('.embla__viewport')
const dots = document.querySelector('.embla__dots')

const a11y = emblaA11y({ dots, dotKeys: true })
const emblaApi = EmblaCarousel(viewport, {}, [a11y])

dots.append(
  ...emblaApi.snapList().map((_, index) => {
    const dot = document.createElement('button')
    dot.type = 'button'
    dot.className = 'embla__dot'
    dot.addEventListener('click', () => emblaApi.goTo(index))
    return dot
  })
)

export { emblaApi }

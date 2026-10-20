import EmblaCarousel from 'embla-carousel'
import emblaA11y from 'embla-a11y'

const viewport = document.querySelector('.embla__viewport')
const previous = document.querySelector('.embla__prev')
const next = document.querySelector('.embla__next')
const dots = document.querySelector('.embla__dots')
const announcer = document.querySelector('.embla__announcer')

const emblaApi = EmblaCarousel(viewport, {}, [
  emblaA11y({ previousButton: previous, nextButton: next, dots, announcer })
])

previous.addEventListener('click', () => emblaApi.goToPrev())
next.addEventListener('click', () => emblaApi.goToNext())
dots.querySelectorAll('button').forEach((dot, index) => {
  dot.addEventListener('click', () => emblaApi.goTo(index))
})

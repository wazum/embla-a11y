import EmblaCarousel, { type EmblaCarouselType } from 'embla-carousel'
import AutoScroll from 'embla-carousel-auto-scroll'
import Autoplay from 'embla-carousel-autoplay'
import Fade from 'embla-carousel-fade'
import { asEmblaV9 } from '../../src/compat/emblaV8.js'
import emblaA11y from '../../src/index.js'
import { variants } from '../variants.js'

declare global {
  interface Window {
    emblaApi?: EmblaCarouselType
  }
}

const parameters = new URLSearchParams(location.search)
const name = parameters.get('variant')
const variant = variants.find((candidate) => candidate.name === name)
if (variant === undefined) throw new Error(`Unknown variant: ${String(name)}`)

const root = document.querySelector<HTMLElement>('.embla')
const container = document.querySelector<HTMLElement>('.embla__container')
if (root === null || container === null) throw new Error('Carousel markup not found')

document.title = `Carousel: ${variant.name}`
setText('#title', `Carousel: ${variant.name}`)
setText('#description', variant.description)

root.style.setProperty('--per-view', String(variant.perView))
root.classList.toggle('embla--vertical', variant.options.axis === 'y')
if (variant.options.direction === 'rtl') root.dir = 'rtl'
const section = root.closest('section')
if (section !== null) section.hidden = parameters.has('hidden')

const rotationButton = document.querySelector<HTMLElement>('.embla__rotation')
if (rotationButton !== null) rotationButton.hidden = variant.rotation === undefined

const productHref = `?variant=${variant.name}&product=`
container.append(
  ...Array.from({ length: variant.slides }, (_, index) => createSlide(productHref, index + 1))
)

const emblaApi = asEmblaV9(
  EmblaCarousel(
    root,
    { ...variant.options, breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } } },
    [
      emblaA11y({
        hideOffscreen: parameters.has('hideOffscreen'),
        previousButton: document.querySelector<HTMLElement>('.embla__prev'),
        nextButton: document.querySelector<HTMLElement>('.embla__next'),
        dots: document.querySelector<HTMLElement>('.embla__dots'),
        announcer: document.querySelector<HTMLElement>('.embla__announcer'),
        rotationButton
      }),
      ...(variant.fade === true ? [Fade()] : []),
      ...(variant.rotation === 'autoplay'
        ? [
            Autoplay({
              delay: 1000,
              ...(variant.startsStopped === true ? { playOnInit: false } : {})
            })
          ]
        : []),
      ...(variant.rotation === 'auto-scroll' ? [AutoScroll({ speed: 2 })] : [])
    ]
  )
)
window.emblaApi = emblaApi
if (variant.startsStopped !== true) {
  emblaApi.plugins().autoplay?.play()
  emblaApi.plugins().autoScroll?.play()
}

document
  .querySelector('.embla__dots')
  ?.append(...emblaApi.snapList().map((_, index) => createDot(index)))

document.querySelector('.embla__prev')?.addEventListener('click', () => emblaApi.goToPrev())
document.querySelector('.embla__next')?.addEventListener('click', () => emblaApi.goToNext())

function createSlide(hrefPrefix: string, number: number): HTMLElement {
  const slide = document.createElement('li')
  slide.className = 'embla__slide'

  const heading = document.createElement('h3')
  heading.textContent = `Product ${number}`

  const link = document.createElement('a')
  link.href = `${hrefPrefix}${number}`
  link.textContent = `Details for product ${number}`

  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = `Add product ${number} to cart`
  button.addEventListener('click', () => setText('#cart-status', `Added product ${number}`))

  slide.append(heading, link, ' ', button)
  return slide
}

function createDot(index: number): HTMLButtonElement {
  const dot = document.createElement('button')
  dot.type = 'button'
  dot.className = 'embla__dot'
  dot.addEventListener('click', () => emblaApi.goTo(index))
  return dot
}

function setText(selector: string, text: string): void {
  const element = document.querySelector(selector)
  if (element !== null) element.textContent = text
}

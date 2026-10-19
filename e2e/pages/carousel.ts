import EmblaCarousel, { type EmblaCarouselType } from 'embla-carousel'
import Fade from 'embla-carousel-fade'
import A11y from '../../src/index.js'
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

const productHref = `?variant=${variant.name}&product=`
container.append(
  ...Array.from({ length: variant.slides }, (_, index) => createSlide(productHref, index + 1))
)

const emblaApi = EmblaCarousel(root, variant.options, [
  A11y({
    hideOffscreen: parameters.has('hideOffscreen'),
    previousButton: document.querySelector<HTMLElement>('.embla__prev'),
    nextButton: document.querySelector<HTMLElement>('.embla__next')
  }),
  ...(variant.fade === true ? [Fade()] : [])
])
window.emblaApi = emblaApi

document.querySelector('.embla__prev')?.addEventListener('click', () => emblaApi.goToPrev())
document.querySelector('.embla__next')?.addEventListener('click', () => emblaApi.goToNext())

function createSlide(hrefPrefix: string, number: number): HTMLElement {
  const slide = document.createElement('div')
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

function setText(selector: string, text: string): void {
  const element = document.querySelector(selector)
  if (element !== null) element.textContent = text
}

import EmblaCarousel, {
  type EmblaCarouselType,
  type EmblaOptionsType,
  type EmblaPluginType
} from 'embla-carousel'

type CarouselFixture = {
  root: HTMLElement
  slides: HTMLElement[]
  emblaApi: EmblaCarouselType
}

export function createCarousel({
  slideCount = 5,
  slideWidth = '20%',
  options = {},
  plugins = [],
  rootAttributes = {}
}: {
  slideCount?: number
  slideWidth?: string
  options?: EmblaOptionsType
  plugins?: EmblaPluginType[]
  rootAttributes?: Record<string, string>
} = {}): CarouselFixture {
  const root = document.createElement('div')
  for (const [name, value] of Object.entries(rootAttributes)) root.setAttribute(name, value)
  root.style.cssText = 'overflow: hidden; width: 1000px'
  const container = document.createElement('div')
  container.style.cssText = 'display: flex'
  const slides = Array.from({ length: slideCount }, (_, index) => {
    const slide = document.createElement('div')
    slide.style.cssText = `flex: 0 0 ${slideWidth}; min-width: 0`
    slide.innerHTML = `<a href="#slide-${index + 1}">Slide ${index + 1}</a>`
    return slide
  })
  container.append(...slides)
  root.append(container)
  document.body.append(root)

  const emblaApi = EmblaCarousel(root, options, plugins)

  return { root, slides, emblaApi }
}

export function attributesOf(element: Element): Record<string, string> {
  return Object.fromEntries(Array.from(element.attributes, ({ name, value }) => [name, value]))
}

export function removeCarousels(): void {
  document.body.replaceChildren()
}

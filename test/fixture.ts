import EmblaCarousel, {
  type EmblaCarouselType,
  type EmblaOptionsType,
  type EmblaPluginType
} from 'embla-carousel'

type ButtonsType = { previous: HTMLButtonElement; next: HTMLButtonElement }

type CarouselFixture = {
  wrapper: HTMLElement
  slides: HTMLElement[]
  buttons: ButtonsType
  emblaApi: EmblaCarouselType
}

export function createCarousel({
  slideCount = 5,
  slideWidth = '20%',
  options = {},
  plugins = [],
  wrapperTag = 'div',
  wrapperAttributes = {},
  heading
}: {
  slideCount?: number
  slideWidth?: string
  options?: EmblaOptionsType
  plugins?: EmblaPluginType[] | ((buttons: ButtonsType) => EmblaPluginType[])
  wrapperTag?: 'div' | 'section'
  wrapperAttributes?: Record<string, string>
  heading?: { id: string; text: string }
} = {}): CarouselFixture {
  const wrapper = document.createElement(wrapperTag)
  for (const [name, value] of Object.entries(wrapperAttributes)) wrapper.setAttribute(name, value)

  if (heading !== undefined) {
    const headingElement = document.createElement('h2')
    headingElement.id = heading.id
    headingElement.textContent = heading.text
    wrapper.append(headingElement)
  }

  const viewport = document.createElement('div')
  viewport.style.cssText = 'overflow: hidden; width: 1000px'
  const container = document.createElement('div')
  container.style.cssText = 'display: flex'
  const slides = Array.from({ length: slideCount }, (_, index) => {
    const slide = document.createElement('div')
    slide.style.cssText = `flex: 0 0 ${slideWidth}; min-width: 0`
    const link = document.createElement('a')
    link.href = `#slide-${index + 1}`
    link.textContent = `Slide ${index + 1}`
    slide.append(link)
    return slide
  })
  container.append(...slides)
  viewport.append(container)
  const buttons = { previous: createButton('Previous'), next: createButton('Next') }
  wrapper.append(viewport, buttons.previous, buttons.next)
  document.body.append(wrapper)

  const emblaApi = EmblaCarousel(
    viewport,
    options,
    typeof plugins === 'function' ? plugins(buttons) : plugins
  )

  return { wrapper, slides, buttons, emblaApi }
}

export function attributesOf(element: Element): Record<string, string> {
  return Object.fromEntries(Array.from(element.attributes, ({ name, value }) => [name, value]))
}

export function removeCarousels(): void {
  document.body.replaceChildren()
}

function createButton(text: string): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = text
  return button
}

import EmblaCarousel, {
  type EmblaCarouselType,
  type EmblaOptionsType,
  type EmblaPluginType
} from 'embla-carousel'
import { asEmblaV9 } from '../src/compat/emblaV8.js'

const carousels: EmblaCarouselType[] = []
const stagedControls: HTMLElement[] = []

type ButtonsType = { previous: HTMLButtonElement; next: HTMLButtonElement; dots: HTMLElement }

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
  heading,
  dotTexts = [],
  dotsAttributes = {},
  list = false,
  listRole = list ? 'list' : null,
  slideTag = list ? 'li' : 'div',
  slideAttributes = {},
  viewportWrapper = false
}: {
  slideCount?: number
  slideWidth?: string
  options?: EmblaOptionsType
  plugins?: EmblaPluginType[] | ((buttons: ButtonsType) => EmblaPluginType[])
  wrapperTag?: 'div' | 'section' | 'main' | 'li' | null
  wrapperAttributes?: Record<string, string>
  heading?: { id: string; text: string }
  dotTexts?: string[]
  dotsAttributes?: Record<string, string>
  list?: boolean
  listRole?: string | null
  slideTag?: 'div' | 'li' | 'article'
  slideAttributes?: Record<string, string>
  viewportWrapper?: boolean
} = {}): CarouselFixture {
  const wrapper = wrapperTag === null ? document.body : document.createElement(wrapperTag)
  for (const [name, value] of Object.entries(wrapperAttributes)) wrapper.setAttribute(name, value)

  if (heading !== undefined) {
    const headingElement = document.createElement('h2')
    headingElement.id = heading.id
    headingElement.textContent = heading.text
    wrapper.append(headingElement)
  }

  const viewport = document.createElement('div')
  viewport.style.cssText = 'overflow: hidden; width: 1000px'
  const container = document.createElement(list ? 'ul' : 'div')
  container.style.cssText = 'display: flex; margin: 0; padding: 0; list-style: none'
  if (listRole !== null) container.setAttribute('role', listRole)
  const slides = Array.from({ length: slideCount }, (_, index) => {
    const slide = document.createElement(slideTag)
    for (const [name, value] of Object.entries(slideAttributes)) slide.setAttribute(name, value)
    slide.style.cssText = `flex: 0 0 ${slideWidth}; min-width: 0`
    const link = document.createElement('a')
    link.href = `#slide-${index + 1}`
    link.textContent = `Slide ${index + 1}`
    slide.append(link)
    return slide
  })
  container.append(...slides)
  viewport.append(container)
  const dots = document.createElement('div')
  for (const [name, value] of Object.entries(dotsAttributes)) dots.setAttribute(name, value)
  dots.append(...dotTexts.map((text) => createButton(text)))
  const buttons = { previous: createButton('Previous'), next: createButton('Next'), dots }
  const viewportBlock = viewportWrapper ? document.createElement('div') : viewport
  if (viewportBlock !== viewport) viewportBlock.append(viewport)
  wrapper.append(viewportBlock, buttons.previous, buttons.next, dots, ...stagedControls.splice(0))
  if (wrapper !== document.body) document.body.append(wrapper)

  const emblaApi = asEmblaV9(
    EmblaCarousel(viewport, options, typeof plugins === 'function' ? plugins(buttons) : plugins)
  )
  carousels.push(emblaApi)

  return { wrapper, slides, buttons, emblaApi }
}

export function attributesOf(element: Element): Record<string, string> {
  return Object.fromEntries(Array.from(element.attributes, ({ name, value }) => [name, value]))
}

export function stageControl<Control extends HTMLElement>(control: Control): Control {
  stagedControls.push(control)
  return control
}

export function removeCarousels(): void {
  stagedControls.length = 0
  for (const emblaApi of carousels.splice(0)) emblaApi.destroy()
  document.body.replaceChildren()
}

function createButton(text: string): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = text
  return button
}

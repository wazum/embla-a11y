import EmblaCarousel, {
  type EmblaCarouselType,
  type EmblaOptionsType,
  type EmblaPluginType
} from 'embla-carousel'
import AutoScroll from 'embla-carousel-auto-scroll'
import Autoplay from 'embla-carousel-autoplay'
import Fade from 'embla-carousel-fade'
import { asEmblaV9 } from '../src/compat/emblaV8.js'
import emblaA11y from '../src/index.js'

type LanguageType = 'en' | 'de'

type DemoType = {
  options?: EmblaOptionsType
  plugins?: () => EmblaPluginType[]
  hideOffscreen?: boolean
  slideAction?: 'save' | 'remove'
}

const demos: Record<string, DemoType> = {
  basics: {},
  peek: {},
  groups: { options: { slidesToScroll: 'auto' } },
  loop: { options: { loop: true } },
  autoplay: { options: { loop: true }, plugins: () => [Autoplay({ delay: 4000 })] },
  'auto-scroll': { options: { loop: true }, plugins: () => [AutoScroll({ speed: 1 })] },
  fade: { plugins: () => [Fade()] },
  'focus-rescue': { slideAction: 'remove' },
  'every-slide': { hideOffscreen: false },
  vertical: { options: { axis: 'y' } },
  german: {}
}

const cities: Record<LanguageType, [city: string, country: string][]> = {
  en: [
    ['Vienna', 'Austria'],
    ['Berlin', 'Germany'],
    ['Paris', 'France'],
    ['Rome', 'Italy'],
    ['Madrid', 'Spain'],
    ['Lisbon', 'Portugal'],
    ['Amsterdam', 'Netherlands'],
    ['Prague', 'Czechia'],
    ['Budapest', 'Hungary'],
    ['Athens', 'Greece']
  ],
  de: [
    ['Wien', 'Österreich'],
    ['Berlin', 'Deutschland'],
    ['Paris', 'Frankreich'],
    ['Rom', 'Italien'],
    ['Madrid', 'Spanien'],
    ['Lissabon', 'Portugal'],
    ['Amsterdam', 'Niederlande'],
    ['Prag', 'Tschechien'],
    ['Budapest', 'Ungarn'],
    ['Athen', 'Griechenland']
  ]
}

const saveTexts: Record<LanguageType, [before: string, after: string]> = {
  en: ['Save', ''],
  de: ['', 'merken']
}

const baseOptions: EmblaOptionsType = {
  align: 'start',
  breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } }
}

const iconPaths = {
  star: 'm12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z',
  copy: 'M11 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  check: 'M20 6 9 17l-5-5'
}

markCurrentVersion()
for (const carousel of document.querySelectorAll<HTMLElement>('[data-demo]')) setUp(carousel)
for (const block of document.querySelectorAll<HTMLElement>('.code-block')) addCopyButton(block)

function markCurrentVersion(): void {
  for (const link of document.querySelectorAll<HTMLAnchorElement>('.version-switch a')) {
    if (link.pathname === location.pathname) link.setAttribute('aria-current', 'page')
  }
}

function setUp(carousel: HTMLElement): void {
  const demo = demos[carousel.dataset.demo ?? '']
  if (demo === undefined) throw new Error(`Unknown demo: ${String(carousel.dataset.demo)}`)
  const viewport = find(carousel, '.carousel__viewport')
  const slides = find(carousel, '.carousel__slides')
  const dots = carousel.querySelector<HTMLElement>('.carousel__dots')
  const rotationButton = carousel.querySelector<HTMLElement>('.carousel__rotation')
  const language = languageOf(carousel)
  const slideAction = demo.slideAction ?? 'save'

  renderSlides(slides, language, slideAction)

  const emblaApi = asEmblaV9(
    EmblaCarousel(viewport, { ...baseOptions, ...demo.options }, [
      ...(demo.plugins?.() ?? []),
      emblaA11y({
        ...(demo.hideOffscreen === undefined ? {} : { hideOffscreen: demo.hideOffscreen }),
        previousButton: carousel.querySelector<HTMLElement>('.carousel__previous'),
        nextButton: carousel.querySelector<HTMLElement>('.carousel__next'),
        dots,
        announcer: carousel.querySelector<HTMLElement>('.carousel__announcer'),
        rotationButton
      })
    ])
  )

  if (rotationButton !== null) {
    emblaApi.plugins().autoplay?.play()
    emblaApi.plugins().autoScroll?.play()
  }
  if (dots !== null) {
    renderDots(emblaApi, dots)
    emblaApi.on('reinit', () => renderDots(emblaApi, dots))
  }
  carousel
    .querySelector('.carousel__previous')
    ?.addEventListener('click', () => emblaApi.goToPrev())
  carousel.querySelector('.carousel__next')?.addEventListener('click', () => emblaApi.goToNext())
  slides.addEventListener('click', (event) => onSlideClick(event))
  carousel
    .closest('.demo')
    ?.querySelector('.demo__restore')
    ?.addEventListener('click', () => renderSlides(slides, language, slideAction))
}

function languageOf(carousel: HTMLElement): LanguageType {
  const language = carousel.closest<HTMLElement>('[lang]')?.lang
  return language === 'de' ? language : 'en'
}

function renderSlides(
  slides: HTMLElement,
  language: LanguageType,
  slideAction: 'save' | 'remove'
): void {
  slides.replaceChildren(
    ...cities[language].map(([city, country], index) => {
      const slide = document.createElement('li')
      slide.className = 'slide'

      const number = document.createElement('span')
      number.className = 'slide__number'
      number.ariaHidden = 'true'
      number.textContent = String(index + 1).padStart(2, '0')

      const heading = document.createElement('h4')
      heading.className = 'slide__city'
      heading.textContent = city

      const countryName = document.createElement('p')
      countryName.className = 'slide__country'
      countryName.textContent = country

      const card = document.createElement('div')
      card.className = 'slide__card'
      card.append(
        number,
        heading,
        countryName,
        slideAction === 'save' ? saveButton(city, language) : removeButton(city)
      )
      slide.append(card)
      return slide
    })
  )
}

function saveButton(city: string, language: LanguageType): HTMLButtonElement {
  const [before, after] = saveTexts[language]
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'slide__action'
  button.setAttribute('aria-pressed', 'false')
  button.dataset.action = 'save'
  button.append(
    icon('slide__star', iconPaths.star),
    ...(before === '' ? [] : [before]),
    hiddenText(before === '' ? `${city} ` : ` ${city}`),
    ...(after === '' ? [] : [after])
  )
  return button
}

function removeButton(city: string): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'slide__action'
  button.dataset.action = 'remove'
  button.append('Remove', hiddenText(` ${city}`))
  return button
}

function hiddenText(text: string): HTMLSpanElement {
  const span = document.createElement('span')
  span.className = 'visually-hidden'
  span.textContent = text
  return span
}

function icon(className: string, pathData: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('class', className)
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', pathData)
  svg.append(path)
  return svg
}

function onSlideClick(event: MouseEvent): void {
  if (!(event.target instanceof Element)) return
  const button = event.target.closest<HTMLButtonElement>('[data-action]')
  if (button === null) return
  if (button.dataset.action === 'remove') {
    button.closest('.slide')?.remove()
    return
  }
  const pressed = button.getAttribute('aria-pressed') === 'true'
  button.setAttribute('aria-pressed', String(!pressed))
}

function renderDots(emblaApi: EmblaCarouselType, dots: HTMLElement): void {
  dots.replaceChildren(
    ...emblaApi.snapList().map((_, index) => {
      const dot = document.createElement('button')
      dot.type = 'button'
      dot.className = 'carousel__dot'
      dot.addEventListener('click', () => emblaApi.goTo(index))
      return dot
    })
  )
}

function addCopyButton(block: HTMLElement): void {
  const code = block.querySelector('code')
  if (code === null || !window.isSecureContext) return

  const status = document.createElement('span')
  status.className = 'visually-hidden'
  status.setAttribute('role', 'status')

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'copy-button'
  button.append(
    icon('icon copy-button__copy', iconPaths.copy),
    icon('icon copy-button__check', iconPaths.check),
    'Copy'
  )
  button.addEventListener('click', () => void copy(code.textContent, button, status))

  block.append(button, status)
}

async function copy(text: string, button: HTMLElement, status: HTMLElement): Promise<void> {
  status.textContent = ''
  try {
    await navigator.clipboard.writeText(text)
    button.dataset.copied = ''
    status.textContent = 'Code copied to clipboard'
    setTimeout(() => delete button.dataset.copied, 2000)
  } catch {
    status.textContent = 'Copying failed. Select the code and copy it yourself.'
  }
}

function find(parent: HTMLElement, selector: string): HTMLElement {
  const element = parent.querySelector<HTMLElement>(selector)
  if (element === null) throw new Error(`${selector} not found`)
  return element
}

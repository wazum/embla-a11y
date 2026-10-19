import type {
  CreateOptionsType,
  CreatePluginType,
  EmblaCarouselType,
  OptionsHandlerType
} from 'embla-carousel'

declare module 'embla-carousel' {
  interface EmblaPluginsType {
    a11y: A11yType | undefined
  }
}

type OptionsType = CreateOptionsType<{
  label: string
}>

export type A11yType = CreatePluginType<{}, OptionsType>

export type A11yOptionsType = A11yType['options']

const defaultOptions: OptionsType = {
  active: true,
  breakpoints: {},
  label: 'Carousel'
}

function A11y(userOptions: A11yOptionsType = {}): A11yType {
  const originalAttributes = new Map<Element, Map<string, string | null>>()
  let removeListeners = (): void => {}

  function init(emblaApi: EmblaCarouselType, optionsHandler: OptionsHandlerType): void {
    const { mergeOptions, optionsAtMedia } = optionsHandler
    const options = optionsAtMedia(
      mergeOptions(mergeOptions(defaultOptions, A11y.globalOptions), userOptions)
    )
    const root = emblaApi.rootNode()

    setAttribute(root, 'role', 'region')
    setAttribute(root, 'aria-label', options.label)

    const onFocusIn = (event: FocusEvent): void => followFocus(emblaApi, event.target)
    root.addEventListener('focusin', onFocusIn)
    removeListeners = () => root.removeEventListener('focusin', onFocusIn)
  }

  function destroy(): void {
    removeListeners()
    for (const [element, attributes] of originalAttributes) {
      for (const [name, value] of attributes) {
        if (value === null) element.removeAttribute(name)
        else element.setAttribute(name, value)
      }
    }
    originalAttributes.clear()
  }

  function followFocus(emblaApi: EmblaCarouselType, target: EventTarget | null): void {
    const root = emblaApi.rootNode()
    root.scrollLeft = 0
    root.scrollTop = 0

    const engine = emblaApi.internalEngine()
    if (!(target instanceof Element) || overflow(target, root, engine.axis.scroll) === 0) return
    const slideIndex = emblaApi.slideNodes().findIndex((slide) => slide.contains(target))
    const snapIndex = engine.scrollSnapList.snapBySlide[slideIndex]
    if (snapIndex !== undefined) emblaApi.goTo(snapIndex, true)

    const clipped = overflow(target, root, engine.axis.scroll)
    if (clipped === 0) return
    engine.scrollBody.useBaseFriction().useDuration(0)
    engine.scrollTo.distance(engine.axis.direction(-clipped), false)
  }

  function setAttribute(element: Element, name: string, value: string): void {
    const attributes = originalAttributes.get(element) ?? new Map<string, string | null>()
    if (!attributes.has(name)) attributes.set(name, element.getAttribute(name))
    originalAttributes.set(element, attributes)
    element.setAttribute(name, value)
  }

  return {
    name: 'a11y',
    options: userOptions,
    init,
    destroy
  }
}

function overflow(element: Element, container: Element, axis: 'x' | 'y'): number {
  const inner = element.getBoundingClientRect()
  const outer = container.getBoundingClientRect()
  const [start, end] = axis === 'x' ? (['left', 'right'] as const) : (['top', 'bottom'] as const)
  if (inner[start] < outer[start]) return inner[start] - outer[start]
  if (inner[end] > outer[end]) return inner[end] - outer[end]
  return 0
}

A11y.globalOptions = undefined as A11yOptionsType | undefined

export default A11y

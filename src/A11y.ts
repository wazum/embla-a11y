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

  function init(emblaApi: EmblaCarouselType, optionsHandler: OptionsHandlerType): void {
    const { mergeOptions, optionsAtMedia } = optionsHandler
    const options = optionsAtMedia(
      mergeOptions(mergeOptions(defaultOptions, A11y.globalOptions), userOptions)
    )
    const root = emblaApi.rootNode()

    setAttribute(root, 'role', 'region')
    setAttribute(root, 'aria-label', options.label)
  }

  function destroy(): void {
    for (const [element, attributes] of originalAttributes) {
      for (const [name, value] of attributes) {
        if (value === null) element.removeAttribute(name)
        else element.setAttribute(name, value)
      }
    }
    originalAttributes.clear()
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

A11y.globalOptions = undefined as A11yOptionsType | undefined

export default A11y

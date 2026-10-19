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
  function init(emblaApi: EmblaCarouselType, optionsHandler: OptionsHandlerType): void {
    const { mergeOptions, optionsAtMedia } = optionsHandler
    const options = optionsAtMedia(
      mergeOptions(mergeOptions(defaultOptions, A11y.globalOptions), userOptions)
    )
    const root = emblaApi.rootNode()

    root.setAttribute('role', 'region')
    root.setAttribute('aria-label', options.label)
  }

  function destroy(): void {}

  return {
    name: 'a11y',
    options: userOptions,
    init,
    destroy
  }
}

A11y.globalOptions = undefined as A11yOptionsType | undefined

export default A11y

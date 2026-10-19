import type {
  CreateOptionsType,
  CreatePluginType,
  EmblaCarouselType,
  OptionsHandlerType
} from 'embla-carousel'
import type { Feature } from './features/Feature.js'
import { FollowFocus } from './features/FollowFocus.js'
import { HideOffscreen } from './features/HideOffscreen.js'
import { Region } from './features/Region.js'

declare module 'embla-carousel' {
  interface EmblaPluginsType {
    a11y: A11yType | undefined
  }
}

type OptionsType = CreateOptionsType<{
  label: string | null
  labelledBy: string | null
  hideOffscreen: boolean
}>

export type A11yType = CreatePluginType<{}, OptionsType>

export type A11yOptionsType = A11yType['options']

const defaultOptions: OptionsType = {
  active: true,
  breakpoints: {},
  label: null,
  labelledBy: null,
  hideOffscreen: false
}

function A11y(userOptions: A11yOptionsType = {}): A11yType {
  let features: Feature[] = []

  function init(emblaApi: EmblaCarouselType, optionsHandler: OptionsHandlerType): void {
    const { mergeOptions, optionsAtMedia } = optionsHandler
    const options = optionsAtMedia(
      mergeOptions(mergeOptions(defaultOptions, A11y.globalOptions), userOptions)
    )

    const viewport = emblaApi.rootNode()
    features = [new Region(viewport.parentElement ?? viewport, options), new FollowFocus(emblaApi)]
    if (options.hideOffscreen) features.push(new HideOffscreen(emblaApi))
  }

  function destroy(): void {
    for (const feature of features) feature.destroy()
    features = []
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

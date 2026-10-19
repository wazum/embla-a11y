import type {
  CreateOptionsType,
  CreatePluginType,
  EmblaCarouselType,
  OptionsHandlerType
} from 'embla-carousel'
import { asEmblaV9 } from './compat/emblaV8.js'
import { DotButtons, type DotLabelType } from './features/DotButtons.js'
import type { Feature } from './features/Feature.js'
import { FocusRescue, type FocusMemoryType } from './features/FocusRescue.js'
import { FollowFocus } from './features/FollowFocus.js'
import { HideOffscreen } from './features/HideOffscreen.js'
import { PreviousNextButtons } from './features/PreviousNextButtons.js'
import { Region } from './features/Region.js'
import { RotationControl, type RotationMemoryType } from './features/RotationControl.js'

declare module 'embla-carousel' {
  interface EmblaPluginsType {
    a11y: A11yType | undefined
  }
}

type OptionsType = CreateOptionsType<{
  label: string | null
  labelledBy: string | null
  hideOffscreen: boolean
  previousButton: HTMLElement | null
  nextButton: HTMLElement | null
  dots: HTMLElement | null
  dotLabel: DotLabelType
}>

export type A11yType = CreatePluginType<{}, OptionsType>

export type A11yOptionsType = A11yType['options']

const defaultOptions: OptionsType = {
  active: true,
  breakpoints: {},
  label: null,
  labelledBy: null,
  hideOffscreen: false,
  previousButton: null,
  nextButton: null,
  dots: null,
  dotLabel: (firstSlide, lastSlide) =>
    firstSlide === lastSlide
      ? `Go to slide ${firstSlide}`
      : `Go to slides ${firstSlide} to ${lastSlide}`
}

function A11y(userOptions: A11yOptionsType = {}): A11yType {
  const focusMemory: FocusMemoryType = { focused: null }
  const rotationMemory: RotationMemoryType = { stoppedByUser: false, playingBeforeResize: null }
  let features: Feature[] = []

  function init(anyEmblaApi: EmblaCarouselType, optionsHandler: OptionsHandlerType): void {
    const emblaApi = asEmblaV9(anyEmblaApi)
    if (emblaApi.internalEngine().isSsr) return
    const { mergeOptions, optionsAtMedia } = optionsHandler
    const options = optionsAtMedia(
      mergeOptions(mergeOptions(defaultOptions, A11y.globalOptions), userOptions)
    )

    const viewport = emblaApi.rootNode()
    const area = viewport.parentElement ?? viewport
    features = [
      new Region(area, options),
      new RotationControl(emblaApi, area, rotationMemory),
      new FollowFocus(emblaApi),
      new PreviousNextButtons(emblaApi, options),
      new FocusRescue(emblaApi, area, options, focusMemory)
    ]
    if (options.hideOffscreen) features.push(new HideOffscreen(emblaApi))
    if (options.dots !== null) {
      features.push(new DotButtons(emblaApi, options.dots, options.dotLabel))
    }
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

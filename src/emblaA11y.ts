import type {
  CreateOptionsType,
  CreatePluginType,
  EmblaCarouselType,
  OptionsHandlerType
} from 'embla-carousel'
import { asEmblaV9 } from './compat/emblaV8.js'
import { Announcer, type AnnouncementType } from './features/Announcer.js'
import { DotButtons, type DotLabelType } from './features/DotButtons.js'
import type { Feature } from './features/Feature.js'
import { FocusRescue, type FocusMemoryType } from './features/FocusRescue.js'
import { FollowFocus } from './features/FollowFocus.js'
import { HideOffscreen } from './features/HideOffscreen.js'
import { PreviousNextButtons } from './features/PreviousNextButtons.js'
import { Region } from './features/Region.js'
import type { RotationLabelType } from './features/RotationButtonText.js'
import { RotationControl, type RotationMemoryType } from './features/RotationControl.js'

declare module 'embla-carousel' {
  interface EmblaPluginsType {
    emblaA11y: EmblaA11yType
  }
}

type OptionsType = CreateOptionsType<{
  label: string | null
  labelledBy: string | null
  hideOffscreen: boolean
  previousButton: HTMLElement | null
  nextButton: HTMLElement | null
  dots: HTMLElement | null
  dotLabel: DotLabelType | null
  rotationButton: HTMLElement | null
  rotationLabel: RotationLabelType | null
  announcer: HTMLElement | null
  announcement: AnnouncementType | null
}>

export type EmblaA11yType = CreatePluginType<{}, OptionsType>

export type EmblaA11yOptionsType = EmblaA11yType['options']

const defaultOptions: OptionsType = {
  active: true,
  breakpoints: {},
  label: null,
  labelledBy: null,
  hideOffscreen: false,
  previousButton: null,
  nextButton: null,
  dots: null,
  dotLabel: null,
  rotationButton: null,
  rotationLabel: null,
  announcer: null,
  announcement: null
}

function emblaA11y(userOptions: EmblaA11yOptionsType = {}): EmblaA11yType {
  const focusMemory: FocusMemoryType = { focused: null }
  const rotationMemory: RotationMemoryType = {
    stoppedByUser: false,
    startedByUser: false,
    playing: null
  }
  let features: Feature[] = []

  function init(anyEmblaApi: EmblaCarouselType, optionsHandler: OptionsHandlerType): void {
    const emblaApi = asEmblaV9(anyEmblaApi)
    if (emblaApi.internalEngine().isSsr) return
    const { mergeOptions, optionsAtMedia } = optionsHandler
    const options = optionsAtMedia(
      mergeOptions(mergeOptions(defaultOptions, emblaA11y.globalOptions), userOptions)
    )
    if (!options.active) return

    const viewport = emblaApi.rootNode()
    const area = viewport.parentElement ?? viewport
    features = [
      new Region(area, options),
      new RotationControl(emblaApi, area, rotationMemory, options),
      new FollowFocus(emblaApi),
      new PreviousNextButtons(emblaApi, options),
      new FocusRescue(emblaApi, area, options, focusMemory)
    ]
    if (options.hideOffscreen) features.push(new HideOffscreen(emblaApi))
    if (options.dots !== null) {
      features.push(new DotButtons(emblaApi, options.dots, options.dotLabel))
    }
    if (options.announcer !== null) {
      features.push(new Announcer(emblaApi, options.announcer, options))
    }
  }

  function destroy(): void {
    for (const feature of features) feature.destroy()
    features = []
  }

  return {
    name: 'emblaA11y',
    options: userOptions,
    init,
    destroy
  }
}

emblaA11y.globalOptions = undefined as EmblaA11yOptionsType | undefined

export default emblaA11y

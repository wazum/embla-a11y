import type {
  CreateOptionsType,
  CreatePluginType,
  EmblaCarouselType,
  OptionsHandlerType
} from 'embla-carousel'
import { asEmblaV9 } from './compat/emblaV8.js'
import { Announcer, type AnnouncementType } from './features/Announcer.js'
import { DotButtons, type DotLabelType } from './features/DotButtons.js'
import type { Feature, WarnType } from './features/Feature.js'
import { FocusRescue, type FocusMemoryType } from './features/FocusRescue.js'
import { FollowFocus } from './features/FollowFocus.js'
import { HideOffscreen } from './features/HideOffscreen.js'
import { PreviousNextButtons } from './features/PreviousNextButtons.js'
import { Region } from './features/Region.js'
import type { RotationLabelType } from './features/RotationButtonText.js'
import { RotationControl, type RotationMemoryType } from './features/RotationControl.js'
import { SlideList } from './features/SlideList.js'

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
  hideOffscreen: true,
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
  const warnings = new Set<string>()
  let features: Feature[] = []

  function warn(message: string): void {
    if (warnings.has(message)) return
    warnings.add(message)
    console.warn(`embla-a11y: ${message}`)
  }

  function init(anyEmblaApi: EmblaCarouselType, optionsHandler: OptionsHandlerType): void {
    const emblaApi = asEmblaV9(anyEmblaApi)
    if (emblaApi.internalEngine().isSsr) return
    const { mergeOptions, optionsAtMedia } = optionsHandler
    const options = optionsAtMedia(
      mergeOptions(mergeOptions(defaultOptions, emblaA11y.globalOptions), userOptions)
    )
    if (!options.active) return

    const viewport = emblaApi.rootNode()
    const controls = [
      options.previousButton,
      options.nextButton,
      options.dots,
      options.announcer,
      options.rotationButton
    ].filter((control) => control !== null)
    const area = carouselArea(viewport, controls, warn)
    features = [
      new Region(area, options, warn),
      new SlideList(emblaApi, warn),
      new RotationControl(emblaApi, area, rotationMemory, options, warn),
      new FollowFocus(emblaApi),
      new PreviousNextButtons(emblaApi, options),
      new FocusRescue(emblaApi, area, options, focusMemory)
    ]
    if (options.hideOffscreen) features.push(new HideOffscreen(emblaApi))
    if (options.dots !== null) {
      features.push(new DotButtons(emblaApi, options.dots, options.dotLabel, warn))
    }
    if (options.announcer !== null) {
      features.push(new Announcer(emblaApi, options.announcer, options, warn))
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

function carouselArea(viewport: HTMLElement, controls: HTMLElement[], warn: WarnType): HTMLElement {
  const parent = viewport.parentElement
  if (parent === null) return viewport
  if (isOffLimits(parent)) {
    warn(
      'there is no element around the viewport, so the plugin uses the viewport as the carousel area. Wrap the viewport and its buttons in a <section> named by a heading.'
    )
    return viewport
  }
  let area = parent
  while (!controls.every((control) => area.contains(control))) {
    const next = area.parentElement
    if (next === null || isOffLimits(next)) {
      warn(
        'a control is outside the carousel, so it is not part of the region, and pressing it does not stop Autoplay. Put the viewport and all its controls in one element, ideally a <section> named by a heading.'
      )
      return parent
    }
    area = next
  }
  return area
}

function isOffLimits(element: HTMLElement): boolean {
  return (
    element === element.ownerDocument.body ||
    element.hasAttribute('role') ||
    ['main', 'nav', 'header', 'footer', 'aside', 'form'].includes(element.localName)
  )
}

export default emblaA11y

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
import { SingleView } from './features/SingleView.js'
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
  dotKeys: boolean
  rotationButton: HTMLElement | null
  rotationLabel: RotationLabelType | null
  announcer: HTMLElement | null
  announcement: AnnouncementType | null
  warnings: boolean
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
  dotKeys: false,
  rotationButton: null,
  rotationLabel: null,
  announcer: null,
  announcement: null,
  warnings: true
}

type CarouselStateType = { rotation: RotationMemoryType; warnings: Set<string> }

// Framework wrappers swap in a new plugin instance when an option changes, so state that must
// outlive it, like a rotation the user stopped, belongs to the carousel, not the instance.
const carouselStates = new WeakMap<HTMLElement, CarouselStateType>()

function emblaA11y(userOptions: EmblaA11yOptionsType = {}): EmblaA11yType {
  const focusMemory: FocusMemoryType = { focused: null }
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
    const state = stateOf(viewport)
    const warn: WarnType = (message) => {
      if (!options.warnings || state.warnings.has(message)) return
      state.warnings.add(message)
      console.warn(`embla-a11y: ${message}`)
    }
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
      new SingleView(emblaApi, area),
      new RotationControl(emblaApi, area, state.rotation, options, warn),
      new FollowFocus(emblaApi),
      new PreviousNextButtons(emblaApi, options),
      new FocusRescue(emblaApi, area, options, focusMemory)
    ]
    if (options.hideOffscreen) features.push(new HideOffscreen(emblaApi))
    if (options.dots !== null) {
      features.push(new DotButtons(emblaApi, options.dots, options, warn))
    }
    if (options.announcer !== null) {
      features.push(new Announcer(emblaApi, options.announcer, options, warn))
    }
    if (emblaApi.snapList().length > 1 && controls.length === 0) {
      warn(
        'the carousel can only be moved by dragging. Keyboard, screen reader and voice control users need buttons, and off-screen slides cannot be reached without them. Pass previousButton and nextButton, or dots.'
      )
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

function stateOf(viewport: HTMLElement): CarouselStateType {
  const existing = carouselStates.get(viewport)
  if (existing !== undefined) return existing
  const created: CarouselStateType = {
    rotation: { stoppedByUser: false, startedByUser: false, playing: null },
    warnings: new Set<string>()
  }
  carouselStates.set(viewport, created)
  return created
}

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

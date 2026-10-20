import type { EmblaCarouselType } from 'embla-carousel'

type EmblaV8Type = {
  canScrollPrev: () => boolean
  canScrollNext: () => boolean
  scrollPrev: (jump?: boolean) => void
  scrollNext: (jump?: boolean) => void
  scrollTo: (index: number, jump?: boolean) => void
  selectedScrollSnap: () => number
  scrollSnapList: () => number[]
  plugins: () => object | undefined
  internalEngine: () => object & { slideRegistry: number[][] }
  on: (event: string, listener: () => unknown) => unknown
  off: (event: string, listener: () => unknown) => unknown
}

type SlideFocusListenerType = () => unknown

const eventNamesV8: Record<string, string> = {
  reinit: 'reInit',
  'autoscroll:play': 'autoScroll:play',
  'autoscroll:stop': 'autoScroll:stop'
}

/**
 * Gives an Embla 8.6 instance the Embla 9 methods the plugin uses.
 * The slidefocus event can cancel the jump to the focused slide, as in Embla 9.
 * Everything else passes through unchanged.
 */
export function asEmblaV9(emblaApi: EmblaCarouselType): EmblaCarouselType {
  if (!isEmblaV8(emblaApi)) return emblaApi
  const emblaV8: EmblaV8Type = emblaApi
  const slideFocusListeners = new Set<SlideFocusListenerType>()
  let jumpBack: (() => void) | null = null
  const onSlideFocusStart = (): void => {
    const snap = emblaV8.selectedScrollSnap()
    const cancelled = [...slideFocusListeners].some((listener) => listener() === false)
    jumpBack = cancelled ? () => emblaV8.scrollTo(snap, true) : null
  }
  const onSlideFocus = (): void => {
    jumpBack?.()
    jumpBack = null
  }

  const emblaV9: EmblaCarouselType = Object.assign(Object.create(emblaApi) as EmblaCarouselType, {
    on: (event: string, listener: SlideFocusListenerType) => {
      if (event !== 'slidefocus') return emblaV8.on(eventNamesV8[event] ?? event, listener)
      if (slideFocusListeners.size === 0) {
        emblaV8.on('slideFocusStart', onSlideFocusStart)
        emblaV8.on('slideFocus', onSlideFocus)
      }
      slideFocusListeners.add(listener)
      return emblaV9
    },
    off: (event: string, listener: SlideFocusListenerType) => {
      if (event !== 'slidefocus') return emblaV8.off(eventNamesV8[event] ?? event, listener)
      slideFocusListeners.delete(listener)
      if (slideFocusListeners.size === 0) {
        emblaV8.off('slideFocusStart', onSlideFocusStart)
        emblaV8.off('slideFocus', onSlideFocus)
      }
      return emblaV9
    },
    canGoToPrev: () => emblaV8.canScrollPrev(),
    canGoToNext: () => emblaV8.canScrollNext(),
    goToPrev: (instant?: boolean) => emblaV8.scrollPrev(instant),
    goToNext: (instant?: boolean) => emblaV8.scrollNext(instant),
    goTo: (index: number, instant?: boolean) => emblaV8.scrollTo(index, instant),
    selectedSnap: () => emblaV8.selectedScrollSnap(),
    snapList: () => emblaV8.scrollSnapList(),
    plugins: () => emblaV8.plugins() ?? {},
    internalEngine: () => {
      const engine = emblaV8.internalEngine()
      return Object.assign(Object.create(engine) as object, {
        scrollSnapList: {
          slidesBySnap: engine.slideRegistry,
          snapBySlide: snapBySlide(engine.slideRegistry)
        }
      })
    }
  })
  return emblaV9
}

function isEmblaV8(emblaApi: object): emblaApi is EmblaV8Type {
  return !('goTo' in emblaApi) && 'scrollTo' in emblaApi
}

function snapBySlide(slideRegistry: number[][]): Record<number, number> {
  const snaps: Record<number, number> = {}
  slideRegistry.forEach((slides, snap) => {
    for (const slide of slides) snaps[slide] = snap
  })
  return snaps
}

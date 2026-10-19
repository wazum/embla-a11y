import type { EmblaCarouselType } from 'embla-carousel'
import { AttributeStore } from '../AttributeStore.js'
import type { Feature } from './Feature.js'

export type DotLabelType = (firstSlide: number, lastSlide: number) => string

const visuallyHidden =
  'position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap'

/**
 * Names each dot button after the slides it shows, with visually hidden text that browser translation reaches.
 * It marks the current dot with aria-current, keeps a dot's own text or label, and never disables a dot.
 */
export class DotButtons implements Feature {
  private readonly emblaApi: EmblaCarouselType
  private readonly container: HTMLElement
  private readonly dotLabel: DotLabelType
  private readonly attributes = new AttributeStore()
  private readonly names = new Map<Element, HTMLSpanElement>()
  private readonly sources = new WeakMap<HTMLSpanElement, string>()
  private readonly observer = new MutationObserver(() => this.update())
  private readonly onSelect = (): void => this.update()

  public constructor(emblaApi: EmblaCarouselType, container: HTMLElement, dotLabel: DotLabelType) {
    this.emblaApi = emblaApi
    this.container = container
    this.dotLabel = dotLabel
    this.update()
    emblaApi.on('select', this.onSelect)
    this.observer.observe(container, { childList: true, subtree: true })
  }

  public destroy(): void {
    this.observer.disconnect()
    this.emblaApi.off('select', this.onSelect)
    for (const name of this.names.values()) name.remove()
    this.names.clear()
    this.attributes.restore()
  }

  private update(): void {
    const { slidesBySnap } = this.emblaApi.internalEngine().scrollSnapList
    const selectedSnap = this.emblaApi.selectedSnap()
    this.container.querySelectorAll('button').forEach((dot, snap) => {
      const slides = slidesBySnap[snap] ?? []
      const first = slides[0]
      const last = slides.at(-1)
      if (first !== undefined && last !== undefined) {
        this.name(dot, this.dotLabel(first + 1, last + 1))
      }
      if (snap === selectedSnap) this.attributes.set(dot, 'aria-current', 'true')
      else this.attributes.remove(dot, 'aria-current')
    })
  }

  private name(dot: HTMLButtonElement, label: string): void {
    const name = this.names.get(dot)
    const ownName = name !== undefined && dot.contains(name) ? name : undefined
    if (name !== undefined && ownName === undefined) this.names.delete(dot)

    if (this.hasAuthorName(dot, ownName)) {
      ownName?.remove()
      this.names.delete(dot)
      return
    }
    if (ownName !== undefined) {
      if (this.sources.get(ownName) === label) return
      ownName.textContent = label
      this.sources.set(ownName, label)
      return
    }
    const created = document.createElement('span')
    created.style.cssText = visuallyHidden
    created.textContent = label
    dot.append(created)
    this.names.set(dot, created)
    this.sources.set(created, label)
  }

  private hasAuthorName(dot: HTMLButtonElement, ownName: HTMLSpanElement | undefined): boolean {
    if (dot.hasAttribute('aria-label') || dot.hasAttribute('aria-labelledby')) return true
    return Array.from(dot.childNodes).some(
      (node) => node !== ownName && (node.textContent ?? '').trim() !== ''
    )
  }
}

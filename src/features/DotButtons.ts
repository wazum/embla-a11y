import type { EmblaCarouselType } from 'embla-carousel'
import { AttributeStore } from '../AttributeStore.js'
import type { Feature } from './Feature.js'

export type DotLabelType = (firstSlide: number, lastSlide: number) => string

const visuallyHidden =
  'position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap'

/**
 * Names each dot button without a name of its own, with visually hidden text from the data-dot-label template in the markup or the dotLabel option.
 * It marks the current dot with aria-current and never disables a dot. Without a template or option it names nothing and warns.
 */
export class DotButtons implements Feature {
  private readonly emblaApi: EmblaCarouselType
  private readonly container: HTMLElement
  private readonly dotLabel: DotLabelType | null
  private warned = false
  private readonly attributes = new AttributeStore()
  private readonly names = new Map<Element, HTMLSpanElement>()
  private readonly sources = new WeakMap<HTMLSpanElement, string>()
  private readonly observer = new MutationObserver(() => this.update())
  private readonly onSelect = (): void => this.update()

  public constructor(
    emblaApi: EmblaCarouselType,
    container: HTMLElement,
    dotLabel: DotLabelType | null
  ) {
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
        this.name(dot, this.labelFor(first + 1, last + 1))
      }
      if (snap === selectedSnap) this.attributes.set(dot, 'aria-current', 'true')
      else this.attributes.remove(dot, 'aria-current')
    })
  }

  private labelFor(firstSlide: number, lastSlide: number): string | null {
    const single = this.container.getAttribute('data-dot-label')
    const group = this.container.getAttribute('data-dot-label-group') ?? single
    const template = firstSlide === lastSlide ? single : group
    if (template !== null) {
      return template
        .replaceAll('{first}', String(firstSlide))
        .replaceAll('{last}', String(lastSlide))
    }
    return this.dotLabel?.(firstSlide, lastSlide) ?? null
  }

  private name(dot: HTMLButtonElement, label: string | null): void {
    const name = this.names.get(dot)
    const ownName = name !== undefined && dot.contains(name) ? name : undefined
    if (name !== undefined && ownName === undefined) this.names.delete(dot)

    if (this.hasAuthorName(dot, ownName)) {
      ownName?.remove()
      this.names.delete(dot)
      return
    }
    if (label === null) {
      this.warnOnce()
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

  private warnOnce(): void {
    if (this.warned) return
    this.warned = true
    console.warn(
      'embla-a11y: a dot button has no name. Give it text in the markup, add a data-dot-label template to the dots element, or pass dotLabel.'
    )
  }

  private hasAuthorName(dot: HTMLButtonElement, ownName: HTMLSpanElement | undefined): boolean {
    if (dot.hasAttribute('aria-label') || dot.hasAttribute('aria-labelledby')) return true
    return Array.from(dot.childNodes).some(
      (node) => node !== ownName && exposedText(node).trim() !== ''
    )
  }
}

function exposedText(node: Node): string {
  if (!(node instanceof Element)) return node.textContent ?? ''
  if (node.matches('[aria-hidden="true"], [hidden]')) return ''
  return Array.from(node.childNodes, exposedText).join('')
}

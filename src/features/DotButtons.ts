import type { EmblaCarouselType } from 'embla-carousel'
import { AttributeStore } from '../AttributeStore.js'
import { visuallyHidden } from '../visuallyHidden.js'
import type { Feature, WarnType } from './Feature.js'

export type DotButtonsOptionsType = {
  dotLabel: DotLabelType | null
  dotKeys: boolean
}

export type DotLabelType = (
  firstSlide: number,
  lastSlide: number,
  page: number,
  pages: number
) => string

/**
 * Names each dot button without a name of its own, with visually hidden text from the data-dot-label template in the markup or the dotLabel option.
 * It marks the current dot with aria-current and never disables a dot. Without a template or option it names nothing and warns.
 */
export class DotButtons implements Feature {
  private readonly emblaApi: EmblaCarouselType
  private readonly container: HTMLElement
  private readonly dotLabel: DotLabelType | null
  private readonly dotKeys: boolean
  private readonly warn: WarnType
  private readonly attributes = new AttributeStore()
  private readonly names = new Map<Element, HTMLSpanElement>()
  private readonly sources = new WeakMap<HTMLSpanElement, string>()
  private readonly observer = new MutationObserver(() => this.update())
  private readonly onSelect = (): void => this.update()
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const dots = Array.from(this.container.querySelectorAll('button'))
    const index = dots.findIndex((dot) => dot === event.target)
    if (index === -1) return
    const target = dots[this.targetIndex(event.key, index, dots.length) ?? -1]
    if (target === undefined) return
    event.preventDefault()
    target.click()
    target.focus()
  }

  public constructor(
    emblaApi: EmblaCarouselType,
    container: HTMLElement,
    { dotLabel, dotKeys }: DotButtonsOptionsType,
    warn: WarnType
  ) {
    this.emblaApi = emblaApi
    this.container = container
    this.dotLabel = dotLabel
    this.dotKeys = dotKeys
    this.warn = warn
    this.update()
    emblaApi.on('select', this.onSelect)
    this.observer.observe(container, { childList: true, subtree: true })
    if (dotKeys) container.addEventListener('keydown', this.onKeyDown)
  }

  public destroy(): void {
    this.observer.disconnect()
    this.emblaApi.off('select', this.onSelect)
    this.container.removeEventListener('keydown', this.onKeyDown)
    for (const name of this.names.values()) name.remove()
    this.names.clear()
    this.attributes.restore()
  }

  private update(): void {
    const { slidesBySnap } = this.emblaApi.internalEngine().scrollSnapList
    const selectedSnap = this.emblaApi.selectedSnap()
    const dots = Array.from(this.container.querySelectorAll('button'))
    this.releaseRemoved(dots)
    dots.forEach((dot, snap) => {
      const slides = slidesBySnap[snap] ?? []
      const first = slides[0]
      const last = slides.at(-1)
      if (first !== undefined && last !== undefined) {
        this.name(dot, this.labelFor(first + 1, last + 1, snap + 1, slidesBySnap.length))
      }
      if (snap === selectedSnap) this.attributes.set(dot, 'aria-current', 'true')
      else this.attributes.remove(dot, 'aria-current')
      if (!this.dotKeys) return
      if (snap === selectedSnap) this.attributes.remove(dot, 'tabindex')
      else this.attributes.set(dot, 'tabindex', '-1')
    })
  }

  private targetIndex(key: string, index: number, count: number): number | null {
    const rightToLeft = getComputedStyle(this.container).direction === 'rtl'
    const forward = rightToLeft ? 'ArrowLeft' : 'ArrowRight'
    const backward = rightToLeft ? 'ArrowRight' : 'ArrowLeft'
    if (key === forward) return (index + 1) % count
    if (key === backward) return (index - 1 + count) % count
    if (key === 'Home') return 0
    if (key === 'End') return count - 1
    return null
  }

  private releaseRemoved(dots: HTMLButtonElement[]): void {
    const current = new Set<Element>(dots)
    for (const [dot, name] of this.names) {
      if (current.has(dot)) continue
      name.remove()
      this.names.delete(dot)
    }
    for (const dot of this.attributes.elements()) {
      if (!current.has(dot)) this.attributes.release(dot)
    }
  }

  private labelFor(
    firstSlide: number,
    lastSlide: number,
    page: number,
    pages: number
  ): string | null {
    const single = this.container.getAttribute('data-dot-label')
    const ownGroup = this.container.getAttribute('data-dot-label-group')
    const template = firstSlide === lastSlide ? (single ?? ownGroup) : (ownGroup ?? single)
    if (firstSlide !== lastSlide && ownGroup === null && single !== null) {
      this.warn(
        'a dot shows several slides, but the dots element has only a data-dot-label template for one, so the dot is named after the first slide. Add a data-dot-label-group template such as "Slides {first} to {last}".'
      )
    }
    if (template !== null) {
      return template
        .replaceAll('{first}', String(firstSlide))
        .replaceAll('{last}', String(lastSlide))
        .replaceAll('{page}', String(page))
        .replaceAll('{pages}', String(pages))
    }
    return this.dotLabel?.(firstSlide, lastSlide, page, pages) ?? null
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
      this.warn(
        'a dot button has no name. Give it text in the markup, add a data-dot-label template to the dots element, or pass dotLabel.'
      )
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
      (node) => node !== ownName && exposedText(node).trim() !== ''
    )
  }
}

function exposedText(node: Node): string {
  if (!(node instanceof Element)) return node.textContent ?? ''
  if (node.matches('[aria-hidden="true"], [hidden]')) return ''
  if (node.matches('img')) return node.getAttribute('alt') ?? ''
  if (node.matches('[role="img"][aria-label]')) return node.getAttribute('aria-label') ?? ''
  return Array.from(node.childNodes, exposedText).join('')
}

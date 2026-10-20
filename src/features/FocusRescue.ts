import type { EmblaCarouselType } from 'embla-carousel'
import { AttributeStore } from '../AttributeStore.js'
import type { Feature } from './Feature.js'
import type { PreviousNextButtonsType } from './PreviousNextButtons.js'

type FocusedType = { element: Element; slideIndex: number }

export type FocusMemoryType = { focused: FocusedType | null }

const focusableSelector = [
  'a[href]',
  'area[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

/**
 * Moves focus to a nearby element when the focused element in the carousel is disabled, hidden or removed.
 * A button hands focus to the other button, a slide to the nearest remaining slide, and otherwise the carousel area takes it.
 * Focus that the user moved away on purpose stays where it is.
 */
export class FocusRescue implements Feature {
  private readonly emblaApi: EmblaCarouselType
  private readonly area: HTMLElement
  private readonly buttons: PreviousNextButtonsType
  private readonly memory: FocusMemoryType
  private readonly attributes = new AttributeStore()
  private readonly observer = new MutationObserver((records) => {
    if (records.some((record) => this.mayAffectFocused(record))) this.rescue()
  })
  private readonly onFocusIn = (event: FocusEvent): void => this.remember(event.target)
  private readonly onFocusOut = (event: FocusEvent): void => this.forget(event)

  public constructor(
    emblaApi: EmblaCarouselType,
    area: HTMLElement,
    buttons: PreviousNextButtonsType,
    memory: FocusMemoryType
  ) {
    this.emblaApi = emblaApi
    this.area = area
    this.buttons = buttons
    this.memory = memory
    this.refreshMemory()
    this.rescue()
    area.addEventListener('focusin', this.onFocusIn)
    area.addEventListener('focusout', this.onFocusOut)
    this.observer.observe(area, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['disabled', 'hidden', 'inert', 'style', 'class']
    })
  }

  public destroy(): void {
    this.observer.disconnect()
    this.area.removeEventListener('focusin', this.onFocusIn)
    this.area.removeEventListener('focusout', this.onFocusOut)
    this.attributes.restore()
  }

  private refreshMemory(): void {
    const remembered = this.memory.focused?.element
    if (remembered?.isConnected === true) this.remember(remembered)
    else if (this.memory.focused === null && this.area.contains(document.activeElement)) {
      this.remember(document.activeElement)
    }
  }

  private remember(target: EventTarget | null): void {
    if (!(target instanceof Element)) return
    const slideIndex = this.emblaApi.slideNodes().findIndex((slide) => slide.contains(target))
    this.memory.focused = { element: target, slideIndex }
  }

  private forget({ target, relatedTarget }: FocusEvent): void {
    if (target === this.area) this.attributes.reset(this.area, 'tabindex')
    if (relatedTarget instanceof Node) {
      if (!this.area.contains(relatedTarget)) this.memory.focused = null
      return
    }
    queueMicrotask(() => {
      const { focused } = this.memory
      if (focused?.element === target && canHoldFocus(focused.element)) this.memory.focused = null
    })
  }

  private mayAffectFocused({ target }: MutationRecord): boolean {
    const element = this.memory.focused?.element
    if (element === undefined) return false
    return !element.isConnected || target.contains(element)
  }

  private rescue(): void {
    const { focused } = this.memory
    if (focused === null) return
    const active = document.activeElement
    const focusMovedOnPurpose =
      active !== null && active !== document.body && active !== focused.element
    if (focusMovedOnPurpose || canHoldFocus(focused.element)) return
    const replacement = this.replacementFor(focused)
    if (replacement instanceof HTMLElement) replacement.focus()
    else this.focusArea()
  }

  private replacementFor({ element, slideIndex }: FocusedType): Element | null {
    const { previousButton, nextButton } = this.buttons
    if (element === nextButton) return usable(previousButton)
    if (element === previousButton) return usable(nextButton)
    if (slideIndex === -1) return null

    const slides = Array.from(this.emblaApi.containerNode().children)
    const byDistance = slides
      .map((slide, index) => ({ slide, distance: index - slideIndex }))
      .toSorted((a, b) => Math.abs(a.distance) - Math.abs(b.distance) || a.distance - b.distance)
    for (const { slide } of byDistance) {
      const focusable = Array.from(slide.querySelectorAll(focusableSelector)).find(canHoldFocus)
      if (focusable !== undefined) return focusable
    }
    return null
  }

  private focusArea(): void {
    if (!this.area.hasAttribute('tabindex')) this.attributes.set(this.area, 'tabindex', '-1')
    this.area.focus()
  }
}

function usable(element: Element | null): Element | null {
  return element !== null && canHoldFocus(element) ? element : null
}

function canHoldFocus(element: Element): boolean {
  return (
    element.isConnected &&
    !element.matches(':disabled') &&
    element.closest('[inert], [hidden]') === null &&
    isVisible(element)
  )
}

function isVisible(element: Element): boolean {
  const shown = element instanceof HTMLAreaElement ? imageOf(element) : element
  if (shown === null) return false
  if (!('checkVisibility' in shown)) return true
  return shown.checkVisibility({ visibilityProperty: true })
}

function imageOf(area: HTMLAreaElement): Element | null {
  const map = area.closest('map')
  if (map === null || map.name === '') return null
  return area.ownerDocument.querySelector(`img[usemap="#${CSS.escape(map.name)}"]`)
}

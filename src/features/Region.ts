import { AttributeStore } from '../AttributeStore.js'
import type { Feature, WarnType } from './Feature.js'

export type RegionNameType = {
  label: string | null
  labelledBy: string | null
}

/**
 * Makes the element around the viewport and its buttons a named region.
 * It keeps a name the author wrote, otherwise it uses labelledBy or label.
 * Without any name it adds no region and warns in the console.
 */
export class Region implements Feature {
  private readonly attributes = new AttributeStore()

  public constructor(element: HTMLElement, name: RegionNameType, warn: WarnType) {
    if (!this.hasName(element) && !this.setName(element, name, warn)) {
      warn(
        'the carousel has no name, so it is not a region. Add a visible heading and pass its id as labelledBy, or pass a label.'
      )
      return
    }
    if (element.localName !== 'section' && !element.hasAttribute('role')) {
      this.attributes.set(element, 'role', 'region')
    }
  }

  public destroy(): void {
    this.attributes.restore()
  }

  private hasName(element: HTMLElement): boolean {
    return element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby')
  }

  private setName(
    element: HTMLElement,
    { label, labelledBy }: RegionNameType,
    warn: WarnType
  ): boolean {
    if (labelledBy !== null && element.ownerDocument.getElementById(labelledBy) === null) {
      warn(`labelledBy is "${labelledBy}", but there is no element with that id.`)
    } else if (labelledBy !== null) {
      this.attributes.set(element, 'aria-labelledby', labelledBy)
      return true
    }
    if (label !== null) {
      this.attributes.set(element, 'aria-label', label)
      return true
    }
    return false
  }
}

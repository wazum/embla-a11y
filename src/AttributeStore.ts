export class AttributeStore {
  private readonly originals = new Map<Element, Map<string, string | null>>()

  public set(element: Element, name: string, value: string): void {
    const attributes = this.originals.get(element) ?? new Map<string, string | null>()
    if (!attributes.has(name)) attributes.set(name, element.getAttribute(name))
    this.originals.set(element, attributes)
    element.setAttribute(name, value)
  }

  public remove(element: Element, name: string): void {
    if (!element.hasAttribute(name)) return
    this.set(element, name, '')
    element.removeAttribute(name)
  }

  public reset(element: Element, name: string): void {
    const attributes = this.originals.get(element)
    if (attributes === undefined || !attributes.has(name)) return
    const value = attributes.get(name) ?? null
    attributes.delete(name)
    if (value === null) element.removeAttribute(name)
    else element.setAttribute(name, value)
  }

  public release(element: Element): void {
    const attributes = this.originals.get(element)
    if (attributes === undefined) return
    restoreAttributes(element, attributes)
    this.originals.delete(element)
  }

  public restore(): void {
    for (const [element, attributes] of this.originals) restoreAttributes(element, attributes)
    this.originals.clear()
  }

  public elements(): Element[] {
    return Array.from(this.originals.keys())
  }
}

function restoreAttributes(element: Element, attributes: Map<string, string | null>): void {
  for (const [name, value] of attributes) {
    if (value === null) element.removeAttribute(name)
    else element.setAttribute(name, value)
  }
}

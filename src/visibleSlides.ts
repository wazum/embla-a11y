export function isOnScreen(slideRect: DOMRect, viewportRect: DOMRect): boolean {
  const overlapWidth =
    Math.min(slideRect.right, viewportRect.right) - Math.max(slideRect.left, viewportRect.left)
  const overlapHeight =
    Math.min(slideRect.bottom, viewportRect.bottom) - Math.max(slideRect.top, viewportRect.top)
  return overlapWidth >= 1 && overlapHeight >= 1
}

export function slidesOnScreen(slides: HTMLElement[], viewport: HTMLElement): boolean[] {
  const viewportRect = viewport.getBoundingClientRect()
  return slides.map((slide) => isOnScreen(slide.getBoundingClientRect(), viewportRect))
}

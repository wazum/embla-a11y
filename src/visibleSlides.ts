export function isOnScreen(slide: HTMLElement, viewport: HTMLElement): boolean {
  const slideRect = slide.getBoundingClientRect()
  const viewportRect = viewport.getBoundingClientRect()
  const overlapWidth =
    Math.min(slideRect.right, viewportRect.right) - Math.max(slideRect.left, viewportRect.left)
  const overlapHeight =
    Math.min(slideRect.bottom, viewportRect.bottom) - Math.max(slideRect.top, viewportRect.top)
  return overlapWidth >= 1 && overlapHeight >= 1
}

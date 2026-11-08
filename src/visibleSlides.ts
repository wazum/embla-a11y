export function isOnScreen(slideRect: DOMRect, viewportRect: DOMRect): boolean {
  const overlapWidth =
    Math.min(slideRect.right, viewportRect.right) - Math.max(slideRect.left, viewportRect.left)
  const overlapHeight =
    Math.min(slideRect.bottom, viewportRect.bottom) - Math.max(slideRect.top, viewportRect.top)
  return overlapWidth >= 1 && overlapHeight >= 1
}

export function isMostlyOnScreen(
  slideRect: DOMRect,
  viewportRect: DOMRect,
  scrollAxis: 'x' | 'y'
): boolean {
  if (!isOnScreen(slideRect, viewportRect)) return false
  const [start, end, size] =
    scrollAxis === 'x'
      ? (['left', 'right', 'width'] as const)
      : (['top', 'bottom', 'height'] as const)
  const overlap =
    Math.min(slideRect[end], viewportRect[end]) - Math.max(slideRect[start], viewportRect[start])
  return overlap >= Math.min(slideRect[size], viewportRect[size]) / 2
}

export function slidesOnScreen(slides: HTMLElement[], viewport: HTMLElement): boolean[] {
  const viewportRect = viewport.getBoundingClientRect()
  return slides.map((slide) => isOnScreen(slide.getBoundingClientRect(), viewportRect))
}

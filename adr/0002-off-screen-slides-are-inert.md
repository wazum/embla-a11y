# Off-screen slides are inert

Status: accepted

## Context

Embla moves the slides but leaves every slide in the page. Without more, Tab, screen readers and voice control reach slides that nobody can see. Experts and audits agree that they should reach only what is on screen:

- Heydon Pickering: "Invisible content should never become focusable." [1]
- The ARIA Authoring Practices: "The screen reader experience can be confusing and disorienting if slides that are not visible on screen are incorrectly hidden". [2]
- Robert Flack (Chrome): making all slides available in the tab order "creates an accessibility anti-pattern". [3]
- In twelve years of plan2net accessibility audits, off-screen slides that Tab reaches are the most common carousel finding.

## Decision

By default (`hideOffscreen: true`), a slide that is completely outside the viewport gets `inert` once the carousel stops moving. A slide that shows even one pixel stays reachable, and the slide that holds focus never becomes inert. `hideOffscreen: false` keeps every slide reachable.

## Consequences

- Inert slides leave the heading list and the link list. A screen reader user: JAWS "only listed up the heading and links of the current" slide. [4]
- Chrome advises against it for list carousels, because it "would affect the item count announced by screen readers". [5] The plugin adds `aria-setsize` and `aria-posinset`, so VoiceOver says the full count. NVDA ignores them and says "list, with 3 items" for ten slides. The guide shows the ways around it: the count in the heading, the announcer, or `hideOffscreen: false`.
- While Autoplay or AutoScroll runs, a slide that moves away becomes inert, also while a screen reader reads it. The rotation button stops it. Without `inert` during rotation, the first Tab would land on slide 1 in the markup, not on the slide on screen.

## Sources

1. Heydon Pickering, [A Content Slider](https://inclusive-components.design/a-content-slider/), Inclusive Components, 22 November 2017
2. W3C WAI, [ARIA Authoring Practices: Carousel Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)
3. Robert Flack, [TAG design review 1055](https://lists.w3.org/Archives/Public/public-webapps-github/2025Feb/0639.html), 26 February 2025
4. Wolfgang Berndorfer, [WebAIM discussion list](https://webaim.org/discussion/mail_message?id=33972), 11 February 2017
5. Chrome for Developers, [Accessible carousels](https://developer.chrome.com/blog/accessible-carousel), 29 September 2025

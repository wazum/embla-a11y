# One announcer, after the user's moves

Status: accepted

The author puts one visually hidden live region with `aria-live="polite"` and `aria-atomic="true"` in the carousel area, in the page from the start. After someone moves the carousel with a button, a dot or a drag, the plugin writes a short position into it once, for example "Slides 4 to 6 of 10". It says nothing on load, on a resize, while Autoplay or AutoScroll move the carousel, or when focus brings a slide into view. The slides get no `aria-live`.

This follows the W3C tutorial: "Use a WAI-ARIA live region to inform screen reader users what item is currently shown." [1]

The ARIA Authoring Practices put `aria-live` on the slides instead: `off` "if the carousel is automatically rotating", `polite` "if the carousel is NOT automatically rotating". [2] The plugin does not, because:

- A live region reads text, and a slide that holds only an image "would be totally silent". Bryan Garaventa sees the "possibly even hidden live region" as the answer. [3]
- Several slides on screen are all read, at length. Shoelace removed `aria-live` from its slides because "it interrupts the virtual cursor". [4] Chrome warns that "each item entering the viewport might be announced one by one". [5]
- WCAG warns of "making an application too "chatty" for a screen reader user". [6]

The region is in the page before anything changes, because the browser must see "the empty live region container first". [7]

## Consequences

- The Authoring Practices example reads the new slide, "giving users immediate feedback". [8] The plugin says only the position. `{heading}` in the template adds the heading of the first slide on screen.
- Without an announcer, buttons and dots give screen reader users no feedback. The plugin warns.

## Sources

1. W3C WAI, [Carousel Functionality](https://www.w3.org/WAI/tutorials/carousels/functionality/), 13 April 2017
2. W3C WAI, [ARIA Authoring Practices: Carousel Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)
3. Bryan Garaventa, [ARIA Authoring Practices mailing list](https://lists.w3.org/Archives/Public/public-aria-practices/2018Dec/0028.html), 18 December 2018
4. Shoelace, [issue 1218](https://github.com/shoelace-style/shoelace/issues/1218), 1 March 2023
5. Chrome for Developers, [Accessible carousels](https://developer.chrome.com/blog/accessible-carousel), 29 September 2025
6. W3C WAI, [Understanding SC 4.1.3: Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
7. Patrick H. Lauke, TetraLogical, [Why are my live regions not working?](https://tetralogical.com/blog/2024/05/01/why-are-my-live-regions-not-working/), 1 May 2024
8. W3C WAI, [Auto-Rotating Image Carousel Example](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/examples/carousel-1-prev-next/), 12 August 2025

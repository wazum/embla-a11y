# Dots are buttons, and focus stays on them

Status: accepted

The dots are plain `<button>` elements. The current dot gets `aria-current="true"`, and no dot is ever disabled. After a press, focus stays on the dot, and the announcer says the new position.

The ARIA Authoring Practices offer two kinds of carousel. One has buttons, the other a slide picker "implemented using the tabs pattern". [1] The plugin uses buttons, because tabs confused people in user tests by Accessible360 [2]:

- Blind users "never experience tabbed interfaces where the tabs follow the tabpanels they control."
- For low-vision users, "carousels typically do not visually resemble tabbed interfaces".
- "Moving a keyboard user's focus programmatically is generally very disruptive". This is why focus does not move to the slide, as the W3C tutorial asks: "the focus should be set on the selected item." [3]

Others agree. Sara Soueidan calls the tabs of CSS carousels "generally misleading and mostly incorrect". [4] Chrome makes links, not tabs, the default for CSS carousel markers, as a "direct response to CSS Carousels criticism". [5]

The Authoring Practices mark the current dot as disabled: it "has the property aria-disabled set to `true`". [1] Screen readers then call a dot unavailable that people can still press. The plugin uses `aria-current`, as Jason Webb advises: "on the button of the slide dot corresponding to the currently-active slide". [6]

## Consequences

- Most screen readers do not say when the focused dot becomes current. Only NVDA and VoiceOver on iOS announce the change. [7] The announcer gives the feedback, and the plugin warns when it is missing.
- Every dot is a Tab stop. `dotKeys: true` makes them one Tab stop with the arrow keys, which react only while a dot has focus.

## Sources

1. W3C WAI, [ARIA Authoring Practices: Carousel Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)
2. Jason Webb, Accessible360, [comment on user tests](https://dev.to/ickers/comment/1hbid), 1 October 2021
3. W3C WAI, [Carousel Functionality](https://www.w3.org/WAI/tutorials/carousels/functionality/), 13 April 2017
4. Sara Soueidan, [Are "CSS Carousels" accessible?](https://www.sarasoueidan.com/blog/css-carousels-accessibility/), 19 August 2025
5. Chromium, [Intent to Ship: CSS scroll-marker-group modes](https://groups.google.com/a/chromium.org/g/blink-dev/c/xRezayRFIJ0/m/L6MzDbmODQAJ), 15 July 2026
6. Jason Webb, [How to build a more accessible carousel or slider](https://dev.to/jasonwebb/how-to-build-a-more-accessible-carousel-or-slider-35lp), 25 May 2021
7. a11ysupport.io, [aria-current change test](https://github.com/accessibilitysupported/a11ysupport.io/blob/master/data/tests/tech/aria/aria-current-change.json), 4 March 2023

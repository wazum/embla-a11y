# Slides are a list

Status: accepted

The slides are a list: `<ul>` and `<li>`, or `role="list"` and `role="listitem"` on plain `<div>` slides. The plugin adds no `role="group"`, no `aria-roledescription` and no slide names. Screen readers then say the count and the position in the user's language.

The W3C has two carousel guides:

- The WAI tutorial uses a list: "carousels are typically best represented as unordered lists, using `<ul>` and `<li>`." [1]
- The ARIA Authoring Practices use groups: "Each slide container has role group with the property aria-roledescription set to slide." [2]

The plugin uses the list, because groups have three problems:

- A group has no count or position, so these go into the name. The same page says: "Normally, including set position and size information in an accessible name is not appropriate." [2]
- Screen readers translate role names, but not `aria-roledescription`: "There is no auto-translation." [3]
- Screen readers support it badly: "NVDA was ignoring it on group" [4], and JAWS read "each link as a "slide" but not a link". [5]

Chrome says the same: "If the content is fundamentally a list, use a `<ul>` element for the correct semantics." [6]

Putting `role="group"` on each `<li>` is no middle way: the items are then no list items, and the count is gone.

## Consequences

- To follow the Authoring Practices, the author writes `role="group"`, `aria-roledescription` and a name on each slide. The plugin keeps them.
- Off-screen slides are `inert` by default. NVDA then counts only the slides on screen and says "list, with 3 items" for ten slides. Chrome warns that inert list items "would affect the item count announced by screen readers". [6] The guide shows the ways around it.

## Sources

1. W3C WAI, [Carousel Structure](https://www.w3.org/WAI/tutorials/carousels/structure/), 13 April 2017
2. W3C WAI, [ARIA Authoring Practices: Carousel Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)
3. Adrian Roselli, [Avoid aria-roledescription](https://adrianroselli.com/2020/04/avoid-aria-roledescription.html), 19 April 2022
4. W3C ARIA Authoring Practices Task Force, [minutes](https://www.w3.org/2020/01/28-aria-apg-minutes.html), 28 January 2020
5. Mark Magennis, [WebAIM discussion list](https://webaim.org/discussion/mail_message?id=49048), 11 May 2023
6. Chrome for Developers, [Accessible carousels](https://developer.chrome.com/blog/accessible-carousel), 29 September 2025

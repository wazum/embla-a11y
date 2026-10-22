# No text of its own

Status: accepted

## Context

Default texts reach pages in the wrong language. Embla's official accessibility plugin names a button "Go to previous Slide". [1] On an Italian site, a slider's labels "are not translated, even though the site locale is set to Italian". [2]

Text in the page gets translated, `aria-label` often not. Adrian Roselli tested browser translation: support for `aria-label` is "still unreliable", and "No browser translated dynamic aria-label." [3] Visually hidden text: "This content will still be translated". [4]

Hidden text is a trap too: "Chrome, Edge, and Firefox will not translate hidden content, even if it becomes visible later." [3]

## Decision

The plugin writes no words in any language. Every name and announcement comes from the page: visible text, templates in `data-` attributes, or callbacks for apps with their own translations. When a text is missing, the plugin names nothing and warns in the console. Names it adds are visually hidden text in the page, not `aria-label`. Only the region name can be an `aria-label`, through the `label` option, as a fallback to a visible heading.

The rotation button keeps its other text in the page, hidden on screen and from screen readers, not with `hidden`.

## Consequences

- An author who ignores the warnings ships buttons without names. GOV.UK takes the other way: "GOV.UK Frontend uses English by default". [5] A missing name shows up in audits and automated tests. A name in the wrong language does not.
- Whether page translation reaches text that the plugin adds after load is not tested.

## Sources

1. Embla Carousel, [accessibility plugin options](https://github.com/davidjerleke/embla-carousel/blob/master/packages/embla-carousel-accessibility/src/components/Options.ts)
2. Bricks forum, [Nestable Slider keeps English aria-labels](https://forum.bricksbuilder.io/t/duplicate-nestable-slider-splide-i18n-translations-parsed-but-never-passed-to-new-splide-arrows-pagination-keep-english-aria-labels/39592), 26 June 2026
3. Adrian Roselli, [aria-label Does Not Translate](https://adrianroselli.com/2019/11/aria-label-does-not-translate.html), 25 July 2025
4. Adrian Roselli, [My Priority of Methods for Labeling a Control](https://adrianroselli.com/2020/01/my-priority-of-methods-for-labeling-a-control.html), 11 February 2026
5. GOV.UK Design System, [Localise GOV.UK Frontend](https://frontend.design-system.service.gov.uk/localise-govuk-frontend/)

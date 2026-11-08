# The announcer names the slides that are mostly on screen

Status: accepted

## Context

The announcer ([0005](0005-one-announcer.md)) says "Slides {first} to {last} of {total}" after the user moves the carousel. Until now it named every slide that showed at least one pixel, the same rule that keeps a slide out of `inert` ([0002](0002-off-screen-slides-are-inert.md)).

On a site at 1280px with `slidesToScroll: 'auto'`, Next moved the carousel by two cards. Card 2 then showed 22px on the left, cards 3 and 4 were whole, and card 5 showed 150px on the right. The announcer said "Projekte 2 bis 5 von 12". The dot for that position said "3 bis 4", and so did the screen. The screen reader user heard four slides after a move by two.

Other carousels leave such slivers out of what they say:

- Splide and Zag are the two libraries whose live region speaks the slides. Splide counts a slide only when it lies fully inside the track [1], Zag when 60% of it is in view [2]. Peeks are `aria-hidden` in both, so they are not read.
- eBay's MIND pattern: "Peek: A partially visible preview of an item on the next or previous slide." [3] A peek belongs to the next slide, not to the one on screen.
- Bootstrap 6 picks the slide that is near fully visible, so "peeking slivers (well below the max) are still ignored." [4]
- Chrome treats the "snapped" slide as the current one. [5]

None of them uses one fixed rule, and none of them is meant for a sentence like "Slides 3 to 4". 50% is the common bar for "in view". The ad industry counts an ad as seen when "50% of the pixels" are on screen, and lowers that to 30% for ads too big for the screen. [6] CSS scroll markers use half the scrollport as the cut-off for the active marker. [7]

Using the dot's snap group instead does not work. With `containScroll`, Embla widens the first and last groups to the ends of the carousel, so at either end the group names slides that are not on screen. After a `dragFree` drag, the selected snap is only the nearest one. Embla's `slidesInView` with `inViewThreshold` measures area, not length along the scroll axis. It reports late, which is why 0002 does not use it either. It is also the author's own option, so the plugin cannot change it.

## Decision

The announcer names a slide when the part of it on screen, measured along the scroll axis, is at least half of the slide or half of the viewport, whichever is smaller. Across the scroll axis one pixel is enough. Taking the smaller of the two keeps a slide wider than the viewport countable.

If no slide passes, for example after a free drag that stops between two slides, it names every slide with at least one pixel on screen, so the user still hears something.

The same rule decides whether a free drag counts as a move that needs an announcement.

`inert` keeps its one-pixel rule. A peek is not named, but it can still be reached by Tab, clicked, and read in browse mode.

## Consequences

- In the case above the announcer says "3 bis 4", like the dot and the screen.
- A slide can now be reachable without being named. Splide and eBay keep the same split between what counts as shown and what can be reached. [1][3]
- A slide that shows almost exactly half is on the edge, and a layout change of one pixel can add it to or drop it from the announcement. No source gives a better cut-off.
- Nothing tells us yet whether screen reader users prefer "3 to 4" or "2 to 5", or whether they miss card 5 in browse mode afterwards. That question is on the list for the next user test.

## Sources

1. Splide, [`Slide.ts` `isVisible`](https://github.com/Splidejs/splide/blob/d7e1f08e6b4f4b02a7c6ccbfbeb2d569d85715e6/src/js/components/Slides/Slide.ts#L248-L260) and [`updateVisibility`](https://github.com/Splidejs/splide/blob/d7e1f08e6b4f4b02a7c6ccbfbeb2d569d85715e6/src/js/components/Slides/Slide.ts#L199-L216)
2. Zag, [`carousel.machine.ts`](https://github.com/chakra-ui/zag/blob/0fbee3b2e10e93774353e8b3779f6c5c29ef22ae/packages/machines/carousel/src/carousel.machine.ts#L306-L324) and [`carousel.connect.ts`](https://github.com/chakra-ui/zag/blob/0fbee3b2e10e93774353e8b3779f6c5c29ef22ae/packages/machines/carousel/src/carousel.connect.ts#L152-L163)
3. eBay, [MIND Patterns: Carousel](https://ebay.gitbook.io/mindpatterns/disclosure/carousel)
4. Bootstrap, [`carousel.ts`](https://github.com/twbs/bootstrap/blob/9062790fdb2379593a2973416dc5a3bfb203e4e3/js/src/carousel.ts#L362-L401), main branch, unreleased v6
5. Chrome for Developers, [Accessible carousels](https://developer.chrome.com/blog/accessible-carousel), 29 September 2025
6. Media Rating Council, [Viewable Ad Impression Measurement Guidelines 1.0](https://www.iab.com/wp-content/uploads/2015/06/MRC-Viewable-Ad-Impression-Measurement-Guideline.pdf), 30 June 2014
7. W3C CSSWG, [CSS Overflow Module Level 5: Calculating the Active Scroll Marker](https://drafts.csswg.org/css-overflow-5/#active-scroll-markers-calculation), Editor's Draft, 16 September 2026

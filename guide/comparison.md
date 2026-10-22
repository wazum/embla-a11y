# embla-a11y or the official plugin?

Use one of them, not both: they manage the same attributes. The same goes for `@bluecadet/embla-carousel-a11y`.

The official [Accessibility plugin](https://www.embla-carousel.com/docs/plugins/accessibility) is maintained by the Embla team and follows the carousel pattern of the ARIA Authoring Practices, with slides labelled "Slide 3 of 10". Choose embla-a11y if you need:

- **Every slide people can see stays readable and reachable.** The official plugin hides every slide outside the selected snap from screen readers and the keyboard, also slides that are fully on screen. With three slides in view and the default `slidesToScroll: 1`, it hides one or two of them. The Embla team keeps this on purpose ([#1389](https://github.com/davidjerleke/embla-carousel/issues/1389)).
- **All texts come from your page, in its language.** The official plugin writes English names over your own: a button that shows "Zurück" is announced as "Go to previous Slide", which voice control users cannot match, and the carousel is called "Carousel" instead of by your heading.
- **Autoplay and AutoScroll that people can stop.** A stop button, a pause while the mouse is over the carousel, a stop on any interaction, and reduced motion. The official plugin leaves this to you.
- **Focus that is never lost or out of sight.** Focus from screen readers, voice control and scripts brings its slide into view, and moves on when the focused element disappears.
- **Your markup back as it was.** On destroy, every attribute goes back to what you wrote. The official plugin removes names you wrote yourself.
- **Embla 8.6 as well as 9.**

> [!NOTE]
> Checked in Chromium against `embla-carousel-accessibility` 9.0.0-rc04.

## Switching

Remove `embla-carousel-accessibility` and its `setup…()` calls, move the texts into your markup as in the [quick start](../README.md#quick-start), and pass your elements to `emblaA11y()`.

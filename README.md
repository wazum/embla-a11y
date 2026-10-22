# embla-a11y

<p align="center">
  <a href="https://github.com/wazum/embla-a11y/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/wazum/embla-a11y/ci.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=ci&labelColor=24273a" alt="CI status"></a>
  <a href="https://wazum.github.io/embla-a11y/"><img src="https://img.shields.io/badge/demo-live-b5ead7?style=for-the-badge&logo=githubpages&logoColor=white&labelColor=24273a" alt="Live demo"></a>
  <a href="https://www.embla-carousel.com"><img src="https://img.shields.io/badge/Embla-8.6%20%7C%209-c3b1e1?style=for-the-badge&labelColor=24273a" alt="Embla Carousel 8.6 and 9"></a>
  <a href="https://www.w3.org/TR/WCAG22/"><img src="https://img.shields.io/badge/WCAG-2.2%20AA-ffb997?style=for-the-badge&labelColor=24273a" alt="Aims at WCAG 2.2 AA"></a>
  <a href="CONTRIBUTING.md#screen-reader-tests"><img src="https://img.shields.io/badge/tested%20with-VoiceOver%20%7C%20NVDA%20%7C%20Orca-a7c7e7?style=for-the-badge&labelColor=24273a" alt="Tested with VoiceOver, NVDA and Orca"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/licence-MIT-ffc6d9?style=for-the-badge&labelColor=24273a" alt="MIT licence"></a>
</p>

An accessibility plugin for [Embla Carousel](https://www.embla-carousel.com) 8.6 and 9. Try it on the [demo site](https://wazum.github.io/embla-a11y/) with your keyboard and screen reader.

The plugin never hides content that people can see. It aims at WCAG 2.2 AA, plus the AAA criteria a carousel can meet. Every change runs automated tests in Chromium, Firefox and WebKit against both Embla versions, and screen reader tests with VoiceOver, NVDA and Orca. It needs Chrome or Edge 110, Firefox 115 or Safari 16 and newer.

Use it instead of the official `embla-carousel-accessibility` plugin or `@bluecadet/embla-carousel-a11y`, not together with them. See [embla-a11y or the official plugin?](guide/comparison.md)

## What it does

- [Carousel name](guide/features.md#carousel-name): screen reader users can find the carousel by its name.
- [Off-screen slides](guide/features.md#off-screen-slides): Tab and screen readers move through the slides people see, and never jump to a slide nobody asked for. A slide that is partly on screen stays reachable.
- [Keep focused content visible](guide/features.md#keep-focused-content-visible): Tab, screen readers and voice control never focus something you can't see.
- [Previous and next buttons](guide/features.md#previous-and-next-buttons): unavailable at the ends without losing focus, and easy to hide when everything fits in one view.
- [Dot buttons](guide/features.md#dot-buttons): the current dot is marked, and every dot has a name.
- [Position announcements](guide/features.md#position-announcements): after a move, screen readers hear "Slides 4 to 6 of 10".
- [Keep focus when content changes](guide/features.md#keep-focus-when-content-changes): when focused content disappears, focus moves to something nearby.
- [Autoplay and AutoScroll](guide/features.md#autoplay-and-autoscroll): a stop button that always says the right thing, a pause while the mouse is over the carousel, a stop on interaction that lasts until the user starts it again, and no rotation for people who prefer reduced motion.
- [Server rendering and frameworks](guide/setup.md#server-rendering-and-frameworks): safe with SSR and the React, Vue and Solid wrappers.
- [Turn off and clean up](guide/features.md#turn-off-and-clean-up): everything the plugin added is taken back.

## Quick start

```sh
npm install embla-a11y
```

Good markup does most of the work. The plugin fills in what markup cannot do on its own: state that changes while the carousel moves, and focus. All texts come from your markup, in your page's language. The plugin never writes English of its own.

```html
<section class="embla" aria-labelledby="products-heading">
  <h2 id="products-heading">Featured products</h2>

  <div class="embla__viewport">
    <ul class="embla__container" role="list">
      <li class="embla__slide">
        <h3>Product 1</h3>
        <a href="/products/1">Details for product 1</a>
      </li>
      <li class="embla__slide">
        <h3>Product 2</h3>
        <a href="/products/2">Details for product 2</a>
      </li>
    </ul>
  </div>

  <button type="button" class="embla__prev">Previous</button>
  <button type="button" class="embla__next">Next</button>

  <div class="embla__dots">
    <button type="button" class="embla__dot"><span class="visually-hidden">Slide 1</span></button>
    <button type="button" class="embla__dot"><span class="visually-hidden">Slide 2</span></button>
  </div>

  <p
    class="embla__announcer visually-hidden"
    aria-live="polite"
    aria-atomic="true"
    data-announcement="Slide {first} of {total}"
    data-announcement-group="Slides {first} to {last} of {total}"
  ></p>
</section>
```

```js
import EmblaCarousel from 'embla-carousel'
import emblaA11y from 'embla-a11y'

const viewport = document.querySelector('.embla__viewport')
const previous = document.querySelector('.embla__prev')
const next = document.querySelector('.embla__next')
const dots = document.querySelector('.embla__dots')
const announcer = document.querySelector('.embla__announcer')

const emblaApi = EmblaCarousel(viewport, {}, [
  emblaA11y({ previousButton: previous, nextButton: next, dots, announcer })
])

previous.addEventListener('click', () => emblaApi.goToPrev())
next.addEventListener('click', () => emblaApi.goToNext())
dots.querySelectorAll('button').forEach((dot, index) => {
  dot.addEventListener('click', () => emblaApi.goTo(index))
})
```

The examples use a common `visually-hidden` class. It hides text on screen and keeps it for screen readers and browser translation:

```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
```

Before you go further:

- Keep the viewport and all its controls in one wrapper, like the `<section>` above. It becomes the [carousel area](guide/setup.md#the-carousel-area).
- You keep your own click handlers; the plugin never moves the carousel on a click. With Embla 8.6 the methods are `scrollPrev`, `scrollNext` and `scrollTo`.
- With other Embla plugins, list `emblaA11y` last ([why](guide/features.md#keep-focused-content-visible)).
- Keep the browser console open. When your markup or options keep the plugin from making the carousel accessible, it [warns there](guide/setup.md#console-warnings) and says how to fix it.

To run it without a build step, load both packages from a CDN with an [import map](guide/setup.md#without-a-build-step).

The JavaScript and the complete HTML examples in this README and the guides run in the test suite, from the files in [`examples/`](examples).

## Documentation

- [Setup](guide/setup.md): the carousel area, Embla 8.6, other plugins, console warnings, a CDN without a build step, server rendering and frameworks.
- [Features](guide/features.md): what each feature does, its options and its markup.
- [Options](guide/options.md): every option with its default.
- [Accessibility checklist](guide/accessibility-checklist.md): what is up to your markup and design, such as a visible heading, a skip link, button size and zoom.
- [embla-a11y or the official plugin?](guide/comparison.md): the differences, and how to switch.
- [Design decisions](adr/README.md): why the plugin works the way it does, with sources.
- [Changelog](CHANGELOG.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT

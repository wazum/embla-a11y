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

Use it instead of the official `embla-carousel-accessibility` plugin or `@bluecadet/embla-carousel-a11y`, not together with them. See [embla-a11y or the official plugin?](#embla-a11y-or-the-official-plugin)

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

The plugin treats the smallest element around the viewport and all the controls you pass as the carousel. It becomes the region, and focus or a press inside it stops Autoplay. Keep the viewport and all its controls in one wrapper, like the `<section>` above. The plugin never takes over `<body>` or a landmark such as `<main>`: then it uses the viewport or its parent, and warns in the console.

> [!IMPORTANT]
> Keep the browser console open while you build the carousel. When your markup or options keep the plugin from making the carousel accessible, for example a missing name, a dot without text or Autoplay without a stop button, it warns there once per carousel and says how to fix it. It never fails silently, and it never fills the gap with English text of its own.
>
> Switch the warnings off only after you have fixed what they say, for example for tests that fail on console output: `warnings: false` for one carousel, or `emblaA11y.globalOptions = { warnings: false }` for all of them.

With Embla 8.6 the methods are `scrollPrev`, `scrollNext` and `scrollTo`. You keep your own click handlers; the plugin never moves the carousel on a click. With other Embla plugins, list `emblaA11y` last ([why](guide/features.md#focus-brings-its-slide-into-view)).

The JavaScript and the complete HTML examples in this README and the guides run in the test suite, from the files in [`examples/`](examples).

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

### Without a build step

The plugin and Embla are plain JavaScript modules, so browsers load them directly from a CDN. An import map lets the JavaScript above run unchanged. Put that JavaScript in a file such as `carousel.js`, and load it as a module after the import map:

```html
<script type="importmap">
  {
    "imports": {
      "embla-carousel": "https://cdn.jsdelivr.net/npm/embla-carousel@9.0.0-rc04/esm/embla-carousel.esm.js",
      "embla-a11y": "https://cdn.jsdelivr.net/npm/embla-a11y@1.1.0/dist/index.js"
    }
  }
</script>
<script type="module" src="carousel.js"></script>
```

- Keep exact versions in the URLs, so no new release changes your page unseen. Update them on purpose, after reading the [changelog](CHANGELOG.md).
- For Embla 8.6, use `embla-carousel@8.6.0/esm/embla-carousel.esm.js` and Embla 8's method names.
- Safari 16.0 to 16.3 have no import maps. For them, write the full URLs into the `import` lines of `carousel.js` instead of the names.
- To host the files yourself, download the package from npm, for example `https://registry.npmjs.org/embla-a11y/-/embla-a11y-1.1.0.tgz`, and serve its `dist` folder.

## What it does

- [Named region](guide/features.md#named-region): screen reader users can find the carousel by its name.
- [Only slides on screen are reachable](guide/features.md#only-slides-on-screen-are-reachable): Tab and screen readers move through the slides people see, and never jump to a slide nobody asked for. A slide that is partly on screen stays reachable.
- [Focus brings its slide into view](guide/features.md#focus-brings-its-slide-into-view): Tab, screen readers and voice control never focus something you can't see.
- [Previous and next buttons](guide/features.md#previous-and-next-buttons): unavailable at the ends without losing focus, and easy to hide when everything fits in one view.
- [Dot buttons](guide/features.md#dot-buttons): the current dot is marked, and every dot has a name.
- [Position announcements](guide/features.md#position-announcements): after a move, screen readers hear "Slides 4 to 6 of 10".
- [Focus never gets lost](guide/features.md#focus-never-gets-lost): when focused content disappears, focus moves to something nearby.
- [Autoplay, AutoScroll and the rotation button](guide/features.md#autoplay-autoscroll-and-the-rotation-button): pauses while the mouse is over it, stops for good on interaction, respects reduced motion, and keeps the button text right.
- [Server rendering and frameworks](guide/features.md#server-rendering-and-frameworks): safe with SSR and the React, Vue and Solid wrappers.
- [Clean destroy and switching off](guide/features.md#clean-destroy-and-switching-off): everything the plugin added is taken back.

## embla-a11y or the official plugin?

Use one of them, not both: they manage the same attributes. The official [Accessibility plugin](https://www.embla-carousel.com/docs/plugins/accessibility) is maintained by the Embla team and follows the carousel pattern of the ARIA Authoring Practices, with slides labelled "Slide 3 of 10". Choose embla-a11y if you need:

- **Every slide people can see stays readable and reachable.** The official plugin hides every slide outside the selected snap from screen readers and the keyboard, also slides that are fully on screen. With three slides in view and the default `slidesToScroll: 1`, it hides one or two of them. The Embla team keeps this on purpose ([#1389](https://github.com/davidjerleke/embla-carousel/issues/1389)).
- **All texts come from your page, in its language.** The official plugin writes English names over your own: a button that shows "Zurück" is announced as "Go to previous Slide", which voice control users cannot match, and the carousel is called "Carousel" instead of by your heading.
- **Autoplay and AutoScroll that people can stop.** A stop button, a pause while the mouse is over the carousel, a stop on any interaction, and reduced motion. The official plugin leaves this to you.
- **Focus that is never lost or out of sight.** Focus from screen readers, voice control and scripts brings its slide into view, and moves on when the focused element disappears.
- **Your markup back as it was.** On destroy, every attribute goes back to what you wrote. The official plugin removes names you wrote yourself.
- **Embla 8.6 as well as 9.**

> [!NOTE]
> Checked in Chromium against `embla-carousel-accessibility` 9.0.0-rc04.

To switch, remove `embla-carousel-accessibility` and its `setup…()` calls, move the texts into your markup as in the [quick start](#quick-start), and pass your elements to `emblaA11y()`.

## Options

All options are optional. Elements you don't pass turn their feature off.

| Option           | Type                                                            | Default | Purpose                                                                                                                                |
| ---------------- | --------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `previousButton` | `HTMLElement`                                                   | `null`  | Previous button, marked unavailable at the start                                                                                       |
| `nextButton`     | `HTMLElement`                                                   | `null`  | Next button, marked unavailable at the end                                                                                             |
| `dots`           | `HTMLElement`                                                   | `null`  | Element that holds the dot buttons                                                                                                     |
| `announcer`      | `HTMLElement`                                                   | `null`  | Live region for position announcements                                                                                                 |
| `rotationButton` | `HTMLElement`                                                   | `null`  | Button that starts and stops Autoplay or AutoScroll; needed with either                                                                |
| `hideOffscreen`  | `boolean`                                                       | `true`  | Makes slides that are fully off-screen `inert`; [`false` keeps every slide reachable](guide/features.md#keeping-every-slide-reachable) |
| `labelledBy`     | `string`                                                        | `null`  | Id of a visible heading, if the markup has no name                                                                                     |
| `label`          | `string`                                                        | `null`  | Text name, if there is no visible heading                                                                                              |
| `dotLabel`       | `(first, last, page, pages) => string`                          | `null`  | Dot names from your translation library, instead of markup                                                                             |
| `dotKeys`        | `boolean`                                                       | `false` | [Only the current dot is a Tab stop; arrow keys move between dots](guide/features.md#fewer-tab-stops-for-many-dots)                    |
| `announcement`   | `(first, last, total, page, pages, slides, headings) => string` | `null`  | Announcement text from your translation library                                                                                        |
| `rotationLabel`  | `(playing) => string`                                           | `null`  | Rotation button text from your translation library                                                                                     |
| `active`         | `boolean`                                                       | `true`  | Switches the plugin off, also per media query                                                                                          |
| `breakpoints`    | `Record<string, options>`                                       | `{}`    | Options per media query, as in Embla                                                                                                   |
| `warnings`       | `boolean`                                                       | `true`  | Console warnings about missing names, texts and buttons                                                                                |

## Best practices

The plugin can't fix everything. The [best practices](guide/best-practices.md) cover what is up to your markup and design: a visible heading, a skip link, button size, zoom, autoplay and more.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT

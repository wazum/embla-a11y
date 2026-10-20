# embla-a11y

An accessibility plugin for [Embla Carousel](https://www.embla-carousel.com) 8.6 and 9. Work in progress, not published yet.

The plugin never hides content that people can see. It aims at WCAG 2.2 AA, plus the AAA criteria a carousel can meet. Every change runs automated tests in Chromium, Firefox and WebKit against both Embla versions, and screen reader tests with VoiceOver, NVDA and Orca. It needs Chrome or Edge 110, Firefox 115 or Safari 16 and newer.

Use it instead of the official `embla-carousel-accessibility` plugin or `@bluecadet/embla-carousel-a11y`, not together with them.

## Quick start

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

The plugin treats the element around the viewport as the carousel. It becomes the region, and focus or a press inside it stops Autoplay. Keep the viewport and all its buttons in one wrapper, like the `<section>` above. If the viewport sits directly in `<body>`, the plugin uses the viewport itself and warns in the console.

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

## What it does

- [Named region](guide/features.md#named-region): screen reader users can find the carousel by its name.
- [Every slide stays reachable](guide/features.md#every-slide-stays-reachable): no slide is hidden from screen readers or the keyboard just because it is partly off-screen.
- [Focus brings its slide into view](guide/features.md#focus-brings-its-slide-into-view): Tab, screen readers and voice control never focus something you can't see.
- [Previous and next buttons](guide/features.md#previous-and-next-buttons): unavailable at the ends without losing focus.
- [Dot buttons](guide/features.md#dot-buttons): the current dot is marked, and every dot has a name.
- [Position announcements](guide/features.md#position-announcements): after a move, screen readers hear "Slides 4 to 6 of 10".
- [Focus never gets lost](guide/features.md#focus-never-gets-lost): when focused content disappears, focus moves to something nearby.
- [Autoplay, AutoScroll and the rotation button](guide/features.md#autoplay-autoscroll-and-the-rotation-button): stops for good on interaction, respects reduced motion, and keeps the button text right.
- [Hiding slides that are off-screen](guide/features.md#hiding-slides-that-are-off-screen): optional, for carousels with too many Tab stops.
- [Server rendering and frameworks](guide/features.md#server-rendering-and-frameworks): safe with SSR and the React, Vue and Solid wrappers.
- [Clean destroy and switching off](guide/features.md#clean-destroy-and-switching-off): everything the plugin added is taken back.

## Options

All options are optional. Elements you don't pass turn their feature off.

| Option           | Type                             | Purpose                                                                 |
| ---------------- | -------------------------------- | ----------------------------------------------------------------------- |
| `previousButton` | `HTMLElement`                    | Previous button, marked unavailable at the start                        |
| `nextButton`     | `HTMLElement`                    | Next button, marked unavailable at the end                              |
| `dots`           | `HTMLElement`                    | Element that holds the dot buttons                                      |
| `announcer`      | `HTMLElement`                    | Live region for position announcements                                  |
| `rotationButton` | `HTMLElement`                    | Button that starts and stops Autoplay or AutoScroll; needed with either |
| `hideOffscreen`  | `boolean`                        | Makes slides that are fully off-screen `inert`                          |
| `labelledBy`     | `string`                         | Id of a visible heading, if the markup has no name                      |
| `label`          | `string`                         | Text name, if there is no visible heading                               |
| `dotLabel`       | `(first, last) => string`        | Dot names from your translation library, instead of markup              |
| `announcement`   | `(first, last, total) => string` | Announcement text from your translation library                         |
| `rotationLabel`  | `(playing) => string`            | Rotation button text from your translation library                      |
| `active`         | `boolean`                        | Switches the plugin off, also per media query                           |
| `breakpoints`    | `Record<string, options>`        | Options per media query, as in Embla                                    |

## Best practices

The plugin can't fix everything. The [best practices](guide/best-practices.md) cover what is up to your markup and design: a visible heading, a skip link, button size, zoom, autoplay and more.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT

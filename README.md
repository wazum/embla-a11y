# embla-a11y

An accessibility plugin for [Embla Carousel](https://www.embla-carousel.com) 8.6 and 9. Work in progress, not published yet.

The plugin never hides content that people can see. It aims at WCAG 2.2 AA, plus the AAA criteria a carousel can meet. Every change runs automated tests in Chromium, Firefox and WebKit against both Embla versions, and screen reader tests with VoiceOver, NVDA and Orca.

Use it instead of the official `embla-carousel-accessibility` plugin or `@bluecadet/embla-carousel-a11y`, not together with them.

## Usage

Good markup does most of the work. The plugin fills in what markup cannot do on its own: state that changes while the carousel moves, and focus.

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

```ts
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

With Embla 8.6 the methods are `scrollPrev`, `scrollNext` and `scrollTo`. You keep your own click handlers; the plugin never moves the carousel on a click.

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

## Features

### Named region

The element around the viewport and its buttons becomes a named region, so screen reader users can find the carousel and know what it is.

- Markup: wrap the viewport and all buttons in a `<section>` with `aria-labelledby` pointing at a visible heading, as in the example above. Then the plugin adds nothing.
- Options: if your markup has no name, pass the id of a visible heading as `labelledBy`, or a text as `label`. The plugin then names the element around the viewport and adds `role="region"` if it is not a `<section>`.
- The plugin never overwrites a name or role you wrote. Without any name it adds no region and warns in the console.

A visible heading is better than `label`: most screen reader users move through a page by headings, and browsers translate visible text but not an `aria-label` added by script.

### Every slide stays reachable

All slides stay readable for screen readers and reachable with the keyboard, including slides that are only partly on screen.

- No configuration.
- Markup: make the slides a list, as in the example. Screen readers then say "list, 10 items" and the position of each slide, in the user's language. Keep `role="list"`: Safari drops list semantics when a list has no bullets. Give each slide a heading, so it shows up in the heading list.

```html
<ul class="embla__container" role="list">
  <li class="embla__slide">
    <h3>Product 1</h3>
    <a href="/products/1">Details for product 1</a>
  </li>
</ul>
```

Don't put `tabindex` on the slides themselves. Only real links, buttons and form fields should be Tab stops.

### Focus brings its slide into view

When something inside a slide gets focus, the carousel moves until it is fully visible. This works for the Tab key, screen readers, voice control and scripts. A mouse or touch press does not move the carousel, so the click lands where you pressed. Focus that the browser restores when someone comes back to the tab does not move it either. The plugin also stops the browser from scrolling the viewport by itself, which would push the slides out of place.

- No configuration.

### Previous and next buttons

At the start and the end, the previous or next button gets `aria-disabled="true"` instead of `disabled`. Screen readers announce it as unavailable, and a keyboard user who presses Next to the end keeps focus on the button. In a loop neither button is ever unavailable.

- Options: `previousButton` and `nextButton`.
- Markup: real `<button type="button">` elements with visible text. Don't set `disabled` yourself. The plugin never changes the button's name.

If your buttons show only an icon, hide the icon and give the button hidden text:

```html
<button type="button" class="embla__next">
  <svg aria-hidden="true" focusable="false">…</svg>
  <span class="visually-hidden">Next slide</span>
</button>
```

Style the unavailable state with the attribute, and keep focus visible:

```css
.embla__prev[aria-disabled='true'],
.embla__next[aria-disabled='true'] {
  opacity: 0.5;
  cursor: default;
}

.embla button:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 2px;
}
```

### Dot buttons

The current dot gets `aria-current="true"`. No dot is ever disabled, and dots you rebuild later get the same treatment.

- Option: `dots`, the element that holds the dot buttons.
- Markup: one `<button type="button">` per snap point, in order. The best name is your own hidden text, rendered on the server in the page's language, as in the example above. The plugin keeps it.

The plugin never writes text of its own, because only your page knows its language. If you build the dots with JavaScript, put a template on the dots element. The plugin fills in the slide numbers and adds the text as visually hidden text, which browser translation can reach:

```html
<div
  class="embla__dots"
  data-dot-label="Slide {first}"
  data-dot-label-group="Slides {first} to {last}"
></div>
```

`data-dot-label-group` is for dots that stand for several slides. In an app with its own translation library, pass `dotLabel(firstSlide, lastSlide)` instead. Without a name, a template or `dotLabel`, the plugin names nothing and warns in the console.

Style the current dot with the attribute, and make each dot at least 24 by 24 pixels:

```css
.embla__dot {
  width: 24px;
  height: 24px;
}

.embla__dot[aria-current='true'] {
  background: currentColor;
}
```

### Position announcements

After someone moves the carousel with a button, a dot or a drag, screen readers hear where they are now, for example "Slides 4 to 6 of 10". It is said once, politely, after the move ends. Nothing is said on load, on a resize, while Autoplay or AutoScroll move the carousel, or when focus brings a slide into view, because then the screen reader already reads the focused element.

- Option: `announcer`, an element you put in the carousel area, outside the slides, with `aria-live="polite"` and `aria-atomic="true"`. Hide it visually.
- Markup: the texts as templates in the page's language. `data-announcement` is for one slide on screen, `data-announcement-group` for several. The plugin fills in `{first}`, `{last}` and `{total}`, counting the slides that are actually on screen.

```html
<p
  class="embla__announcer visually-hidden"
  aria-live="polite"
  aria-atomic="true"
  data-announcement="Slide {first} of {total}"
  data-announcement-group="Slides {first} to {last} of {total}"
></p>
```

Put the element in the page from the start; screen readers only notice live regions that exist before their text changes. Never put `aria-live` on the slides themselves: then every move reads whole slides. In an app with its own translation library, pass `announcement(firstSlide, lastSlide, totalSlides)` instead of the templates. Without either, the plugin announces nothing and warns in the console.

### Focus never gets lost

If your code disables, hides or removes the element that has focus, the plugin moves focus to a nearby element instead of letting it fall back to the top of the page. A button hands focus to the other button, a slide to the nearest remaining slide, and if nothing is left, the carousel itself takes focus. Focus that the user moved away on purpose stays where it is.

- No configuration. For the buttons it uses `previousButton` and `nextButton`.

### Autoplay, AutoScroll and the rotation button

If you use the Autoplay or AutoScroll plugin, any focus or press inside the carousel stops it for good. That includes focus from a screen reader, voice control or a script, not only the Tab key. The carousel then stays where the user is, and the focused slide comes into view. A resize keeps the rotation as it was: once a user stopped it, it stays stopped, and a rotation nobody stopped keeps running.

The rotation button starts and stops the rotation. Its text always says what pressing it will do. The text follows every change, also a stop through focus or a call to `play()` or `stop()` in your code. Focus on the button itself does not stop the rotation.

- No configuration for the stop on interaction. List the Autoplay or AutoScroll plugin together with this plugin.
- Option: `rotationButton` for the button.
- Markup: a real `<button type="button">` inside the carousel area, before the slides, so people reach it before the moving content. Put both texts in it, in the page's language: one element with `data-rotation-playing` for while it runs, one with `data-rotation-stopped` and `hidden` for while it is stopped. The plugin only switches `hidden` between them.

```html
<section class="embla" aria-labelledby="products-heading">
  <h2 id="products-heading">Featured products</h2>
  <button type="button" class="embla__rotation">
    <svg aria-hidden="true" focusable="false">…</svg>
    <span data-rotation-playing>Stop slide rotation</span>
    <span data-rotation-stopped hidden>Start slide rotation</span>
  </button>
  <div class="embla__viewport">…</div>
</section>
```

In an app with its own translation library, pass `rotationLabel(playing)` instead. It writes the text into the button, or into an element with `data-rotation-label`. Without texts or `rotationLabel`, the plugin leaves the button alone and warns in the console.

```ts
emblaA11y({ rotationButton: document.querySelector('.embla__rotation') })
```

For people who asked their system for reduced motion, Autoplay and AutoScroll do not start, and they stop as soon as someone turns the setting on. The rotation button can still start them: pressing it is a clear choice. The moves after a button press stay animated, so make them instant with Embla's `breakpoints` option:

```ts
EmblaCarousel(viewport, { breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } } })
```

### Hiding slides that are off-screen

By default every slide stays reachable, which in a long carousel means many Tab stops. With this option, slides that are completely outside the viewport become `inert`: screen readers, the keyboard and the mouse skip them. A slide becomes reachable as soon as any part of it is on screen, and the slide that holds focus is never hidden. Screen reader users then only find the slides on screen in their heading and link lists, so use it only when the long Tab sequence is the bigger problem.

- Option: `hideOffscreen: true`.

Often a link that skips past the carousel is the better answer. Put it before the carousel and point it at the content after it:

```html
<a class="skip-link" href="#after-products">Skip past featured products</a>
<section class="embla" aria-labelledby="products-heading">…</section>
<div id="after-products" tabindex="-1">…</div>
```

Make the skip link visible when it has focus.

### Server rendering and frameworks

The plugin adds nothing on the server. The React, Vue and Solid wrappers also create an instance without a root element, and the plugin leaves that one alone too.

- No configuration.
- Markup: render the section, heading, list, buttons and dot names on the server. Then the carousel is accessible before JavaScript runs.

### Clean destroy and switching off

When the plugin is destroyed or Embla re-initialises, every attribute and text the plugin added goes back to how it was. The same happens when you switch the plugin off, for example on wide screens where the carousel becomes a plain grid:

```ts
emblaA11y({ breakpoints: { '(min-width: 900px)': { active: false } } })
```

- No configuration for the cleanup. Use `active: false`, directly or in `breakpoints`, to switch the plugin off.

## Best practices

These come from accessibility experts and from people who use screen readers, magnifiers, voice control or the keyboard.

**Name the carousel with a visible heading.** Most screen reader users move through a page by headings, and a visible heading gets translated.

**Don't hide slides that are on screen.** Hiding visible slides from screen readers locks out people who see the screen and also use speech, and people who use voice control. Hidden slides also disappear from the heading and link lists that screen reader users navigate with.

**Offer a way past long carousels.** Because every slide stays reachable, a keyboard user tabs through all of them. A skip link before the carousel saves them the trip.

**Add buttons.** Dragging must never be the only way to move the carousel (WCAG 2.5.7). Use real `<button>` elements with visible text, at least 24 by 24 pixels, and keep them visible when they have focus.

**Keep the visible text as the button name.** If a button says "Next", don't give it a different `aria-label`. Voice control users say what they see.

**Prefer text in the page over `aria-label`.** Browsers translate text in the page, but not an `aria-label`, and text rendered on the server works before JavaScript runs.

**Avoid autoplay.** Moving content is the most common complaint from disabled users, and it can make people with vestibular disorders feel sick. If you need it, put a stop button before the slides, stop for good when someone interacts with the carousel, and don't start it when the user asks for reduced motion.

**Don't take over the arrow keys.** Screen readers use them to read. Buttons and the Tab key are enough.

**Announce little.** A screen reader should hear a short position such as "3 of 10" after the user moves the carousel, not the whole slide, and nothing while it moves by itself.

## License

MIT

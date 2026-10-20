# Features

Each section says what the plugin does, which option turns it on, and what markup it expects. The markup examples use the `visually-hidden` class from the [README](../README.md#quick-start).

- [Named region](#named-region)
- [Only slides on screen are reachable](#only-slides-on-screen-are-reachable)
- [Focus brings its slide into view](#focus-brings-its-slide-into-view)
- [Previous and next buttons](#previous-and-next-buttons)
- [Dot buttons](#dot-buttons)
- [Position announcements](#position-announcements)
- [Focus never gets lost](#focus-never-gets-lost)
- [Autoplay, AutoScroll and the rotation button](#autoplay-autoscroll-and-the-rotation-button)
- [Server rendering and frameworks](#server-rendering-and-frameworks)
- [Clean destroy and switching off](#clean-destroy-and-switching-off)

## Named region

The smallest element around the viewport and all its controls becomes a named region, so screen reader users can find the carousel and know what it is. An extra wrapper around the viewport is fine; the plugin looks past it.

- Markup: wrap the viewport and all buttons in a `<section>` with `aria-labelledby` pointing at a visible heading, as in the README example. Then the plugin adds nothing. If you name a `<div>` instead, the plugin adds `role="region"`, because a name on a plain `<div>` reaches no screen reader.
- Options: if your markup has no name, pass the id of a visible heading as `labelledBy`, or a text as `label`. The plugin then names the element around the viewport and adds `role="region"` if it is not a `<section>`.
- The plugin never overwrites a name or role you wrote. Without any name it adds no region and warns in the console.

A visible heading is better than `label`: most screen reader users move through a page by headings, and browsers translate visible text but not an `aria-label` added by script.

## Only slides on screen are reachable

Slides that are completely outside the viewport become `inert`: the keyboard, screen readers, voice control and the mouse skip them. A slide is reachable as soon as any part of it is on screen, and the slide that holds focus is never hidden. So whether someone tabs or reads with a screen reader, forwards or backwards, from the buttons into the slides, they land on the slides they see. The carousel never jumps to a slide nobody asked for. To reach other slides, people use the buttons or the dots, just as they would with their eyes.

- No configuration. To keep every slide reachable instead, see [Keeping every slide reachable](#keeping-every-slide-reachable).
- Markup: make the slides a list. Screen readers then say "list" and the position of each slide, in the user's language. If the slides are list items, the plugin adds `aria-posinset` and `aria-setsize`, so the position and the full count stay right while slides are hidden. Keep `role="list"`: Safari drops list semantics when a list has no bullets. Give each slide a heading, so it shows up in the heading list.
- If your slides are plain `<div>` elements, as in Embla's own examples, the plugin turns them into a list with `role="list"` and `role="listitem"`, and takes the roles back on destroy. It never touches slides that already have a role. Other elements, such as `<article>`, keep their meaning, and the plugin warns in the console, because screen readers then cannot tell how many slides there are.

```html
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
```

Don't put `tabindex` on the slides themselves. Only real links, buttons and form fields should be Tab stops.

> [!NOTE]
> VoiceOver reads the full count, for example "list, 10 items". NVDA ignores `aria-setsize` and counts only the slides on screen, so it says "list, with 3 items". Both read the right content; only NVDA's count differs.

> [!NOTE]
> Slides that are off-screen are not in the heading list, the link list or the browser's find-in-page until they come into view. If people need to search or scan every item, link to a page that lists them all, for example "All 10 featured products".

> [!TIP]
> A slide that is only partly visible stays reachable, because people can see it. Stepping onto it moves the carousel just enough to show it in full. That is the only movement focus causes, and it always goes towards something already on screen.

> [!IMPORTANT]
> With Autoplay or AutoScroll, a slide that moves out of view becomes `inert`, also while a screen reader reads it. People who read without moving focus can only stop the rotation with the rotation button, so always pass [`rotationButton`](#autoplay-autoscroll-and-the-rotation-button).

### Why a list, and not "Slide 3 of 10"

The carousel pattern of the [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) labels each slide as a group with `aria-roledescription="slide"` and a name like "Slide 3 of 10". The plugin uses a list instead:

- A list gives the count and the position in the user's own language and verbosity settings, and lets people jump through the items with their screen reader's list commands. A group offers neither.
- `aria-roledescription` replaces the role name that screen readers would translate themselves, so every page has to translate it. [MDN advises](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-roledescription) avoiding it, and the [Authoring Practices task force](https://www.w3.org/2020/01/28-aria-apg-minutes.html) found NVDA ignoring it on groups. A [tester on WebAIM](https://webaim.org/discussion/mail_message?id=49048) heard JAWS announce links as "slide".
- A name on every slide is read before its content, each time someone enters a slide.

> [!TIP]
> If an audit asks for the Authoring Practices pattern exactly, write it in your markup: `role="group"`, `aria-roledescription` and a name on each slide, in your page's language. The plugin keeps roles you wrote and adds no list then.

### Keeping every slide reachable

Pass `hideOffscreen: false` when people must find every slide in the heading and link lists or with find-in-page, and the carousel has only a few slides. Then no slide is ever `inert`, and the plugin adds no list positions, because the browser counts the items itself.

> [!WARNING]
> With every slide reachable, the reading order runs through all slides, not only the ones on screen. Someone who pages to slides 4 to 6 with buttons placed after the slides and then reads backwards lands on slide 10, and the carousel moves there to show it. With buttons before the slides, reading forwards lands on slide 1. The carousel stays correct, since focus is never on something unseen, but the jump is confusing. Only switch this off when the reasons above outweigh it.

Tab then also passes every link and button in every slide. Put a link before the carousel that skips past it, pointing at the content after it:

```html
<a class="skip-link" href="#after-products">Skip past featured products</a>
<section class="embla" aria-labelledby="products-heading">…</section>
<div id="after-products" tabindex="-1">…</div>
```

Make the skip link visible when it has focus.

## Focus brings its slide into view

When something inside a slide gets focus, the carousel moves until it is fully visible. This works for the Tab key, screen readers, voice control and scripts. A mouse or touch press does not move the carousel, so the click lands where you pressed. Focus that the browser restores when someone comes back to the tab does not move it either. The plugin also stops the browser from scrolling the viewport by itself, which would push the slides out of place.

- No configuration.
- List `emblaA11y` after Embla's other plugins. When the focused slide is already fully visible, the plugin cancels Embla's `slidefocus` jump, and Embla 9 then skips every `slidefocus` listener registered after it. Plugins listed later miss the event, and so do listeners you add with `emblaApi.on('slidefocus', …)` after creating the carousel.

## Previous and next buttons

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

## Dot buttons

The current dot gets `aria-current="true"`. No dot is ever disabled, and dots you rebuild later get the same treatment.

- Option: `dots`, the element that holds the dot buttons.
- Markup: one `<button type="button">` per snap point, in order. The best name is your own hidden text, rendered on the server in the page's language, as in the README example. The plugin keeps it.

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

## Position announcements

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

## Focus never gets lost

If your code disables, hides or removes the element that has focus, the plugin moves focus to a nearby element instead of letting it fall back to the top of the page. A button hands focus to the other button, a slide to the nearest remaining slide, and if nothing is left, the carousel itself takes focus. Focus that the user moved away on purpose stays where it is.

- No configuration. For the buttons it uses `previousButton` and `nextButton`.

## Autoplay, AutoScroll and the rotation button

If you use the Autoplay or AutoScroll plugin, any focus or press inside the carousel stops it for good. That includes focus from a screen reader on a link or button, voice control or a script, not only the Tab key. Reading with a screen reader does not move focus, so it does not stop the rotation; for those users the rotation button is the only way to stop it. The carousel then stays where the user is, and the focused slide comes into view. A resize keeps the rotation as it was: once a user stopped it, it stays stopped, and a rotation nobody stopped keeps running.

The rotation button starts and stops the rotation. Its text always says what pressing it will do. The text follows every change, also a stop through focus or a call to `play()` or `stop()` in your code. Focus on the button itself does not stop the rotation.

- No configuration for the stop on interaction. List the Autoplay or AutoScroll plugin before this plugin.
- With Embla 9, Autoplay and AutoScroll no longer start on their own. Call `play()` after creating the carousel, as in the example below. With Embla 8.6 they start by themselves.
- Option: `rotationButton` for the button. You need it whenever you use Autoplay or AutoScroll. Without it the plugin warns in the console.
- When there is nothing to rotate, the button gets `aria-disabled="true"`: without Autoplay or AutoScroll (the plugin also warns then), or while all slides fit in one view. Style it with the attribute, as for the previous and next buttons.
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

For people who asked their system for reduced motion, Autoplay and AutoScroll do not start, and they stop as soon as someone turns the setting on. The rotation button can still start them: pressing it is a clear choice. The moves after a button press stay animated, so make them instant with Embla's `breakpoints` option:

```js
import EmblaCarousel from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'
import emblaA11y from 'embla-a11y'

const viewport = document.querySelector('.embla__viewport')
const rotationButton = document.querySelector('.embla__rotation')

const emblaApi = EmblaCarousel(
  viewport,
  { breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } } },
  [Autoplay(), emblaA11y({ rotationButton })]
)

emblaApi.plugins().autoplay.play()
```

## Server rendering and frameworks

The plugin adds nothing on the server. The React, Vue and Solid wrappers also create an instance without a root element, and the plugin leaves that one alone too.

- No configuration.
- Markup: render the section, heading, list, buttons and dot names on the server. Then the carousel is accessible before JavaScript runs.

## Clean destroy and switching off

When the plugin is destroyed or Embla re-initialises, every attribute and text the plugin added goes back to how it was. The same happens when you switch the plugin off, for example on wide screens where the carousel becomes a plain grid:

```js
emblaA11y({
  previousButton: previous,
  breakpoints: { '(min-width: 900px)': { active: false } }
})
```

- No configuration for the cleanup. Use `active: false`, directly or in `breakpoints`, to switch the plugin off.

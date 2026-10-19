# embla-carousel-a11y

An accessibility plugin for [Embla Carousel](https://www.embla-carousel.com) v9. Work in progress, not published yet.

The plugin never hides content that people can see, and it lets them control motion. It aims at WCAG 2.2 AA, plus the AAA criteria a carousel can meet. We test it in real browsers and with real screen readers (VoiceOver, NVDA, Orca).

## Usage

```html
<section class="embla" aria-labelledby="products-heading">
  <h2 id="products-heading">Featured products</h2>
  <div class="embla__viewport">
    <div class="embla__container">
      <div class="embla__slide">…</div>
    </div>
  </div>
  <button type="button">Previous</button>
  <button type="button">Next</button>
</section>
```

```ts
import EmblaCarousel from 'embla-carousel'
import A11y from 'embla-carousel-a11y'

EmblaCarousel(document.querySelector('.embla__viewport'), {}, [A11y()])
```

If your markup has no name for the carousel, pass the id of a visible heading with `labelledBy`, or a text with `label`. The plugin then names the element around the viewport and adds the region role. It never overwrites a name or role you wrote yourself.

## What it does today

- It names the carousel region only where your markup leaves a gap. Without any name it adds no region and warns in the console.
- Every slide stays readable for screen readers and reachable with the keyboard, including slides that are only partly on screen.
- When something inside a slide gets focus, the carousel moves that slide into view. This works for the Tab key, screen readers, voice control and scripts. Embla on its own only reacts to Tab.
- It stops the browser from scrolling the carousel by itself when focus moves, which would otherwise shift the slides out of place.
- When the plugin is destroyed or Embla re-initialises, every attribute it changed goes back to its original value.

## Hiding slides that are off-screen

By default every slide stays reachable. In a long carousel that means many Tab stops. With `hideOffscreen: true`, slides that are completely outside the viewport become `inert`: screen readers, the keyboard and the mouse skip them.

```ts
EmblaCarousel(viewport, {}, [A11y({ hideOffscreen: true })])
```

A slide stays reachable as soon as any part of it is on screen, also while the carousel moves, and while something inside it has focus. Screen reader users then only find the slides on screen in their heading and link lists, so use this mode only when the long Tab sequence is the bigger problem.

## Best practices

These come from accessibility experts and from people who use screen readers, magnifiers, voice control or the keyboard.

**Name the carousel with a visible heading.** Wrap the viewport and its buttons in a `<section>` and point `aria-labelledby` at a heading. Most screen reader users move through a page by headings, and a visible heading gets translated, while an `aria-label` added by script does not.

**Don't hide slides that are on screen.** Hiding visible slides from screen readers locks out people who see the screen and also use speech, and people who use voice control. Hidden slides also disappear from the heading and link lists that screen reader users navigate with.

**Offer a way past long carousels.** Because every slide stays reachable, a keyboard user tabs through all of them. In a carousel with many slides, add a link before it that jumps to the content after it, for example "Skip past featured products". Make it visible when it has focus.

**Add buttons.** Dragging must never be the only way to move the carousel (WCAG 2.5.7). Use real `<button>` elements with visible text, at least 24 by 24 pixels, and keep them visible when they have focus.

**Keep the visible text as the button name.** If a button says "Next", don't give it a different `aria-label`. Voice control users say what they see.

**Avoid autoplay.** Moving content is the most common complaint from disabled users, and it can make people with vestibular disorders feel sick. If you need it, put a stop button before the slides, stop for good when someone interacts with the carousel, and don't start it when the user asks for reduced motion.

**Don't take over the arrow keys.** Screen readers use them to read. Buttons and the Tab key are enough.

**Announce little.** A screen reader should hear a short position such as "3 of 10" after the user moves the carousel, not the whole slide, and nothing while it moves by itself.

## License

MIT

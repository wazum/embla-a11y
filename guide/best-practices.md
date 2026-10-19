# Best practices

The plugin can't fix everything. These come from accessibility experts and from people who use screen readers, magnifiers, voice control or the keyboard.

## Name the carousel with a visible heading

Most screen reader users move through a page by headings, and a visible heading gets translated.

## Don't hide slides that are on screen

Hiding visible slides from screen readers locks out people who see the screen and also use speech, and people who use voice control. Hidden slides also disappear from the heading and link lists that screen reader users navigate with.

## Offer a way past long carousels

Because every slide stays reachable, a keyboard user tabs through all of them. A [skip link](features.md#hiding-slides-that-are-off-screen) before the carousel saves them the trip.

## Add buttons

Dragging must never be the only way to move the carousel (WCAG 2.5.7). Use real `<button>` elements with visible text, at least 24 by 24 pixels, and keep them visible when they have focus.

## Don't hide unavailable buttons with `opacity: 0`

A transparent button can still get focus, so keyboard users land on something they cannot see. If both buttons are unavailable and you want them gone, use `hidden` or `display: none`.

## Let people zoom

If you set `touch-action` on the carousel, keep `pinch-zoom` in it, for example `touch-action: pan-y pinch-zoom`. Without it, people with low vision cannot zoom into the slides on a touch screen.

## Keep the visible text as the button name

If a button says "Next", don't give it a different `aria-label`. Voice control users say what they see.

## Prefer text in the page over `aria-label`

Browsers translate text in the page, but not an `aria-label`, and text rendered on the server works before JavaScript runs.

## Avoid autoplay

Moving content is the most common complaint from disabled users, and it can make people with vestibular disorders feel sick. If you need it, put a [stop button](features.md#autoplay-autoscroll-and-the-rotation-button) before the slides, stop for good when someone interacts with the carousel, and don't start it when the user asks for reduced motion.

## Don't take over the arrow keys

Screen readers use them to read. Buttons and the Tab key are enough.

## Announce little

A screen reader should hear a short position such as "3 of 10" after the user moves the carousel, not the whole slide, and nothing while it moves by itself.

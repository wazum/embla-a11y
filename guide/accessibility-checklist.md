# Accessibility checklist

The plugin can't fix everything. These points are up to your markup and design. They come from accessibility experts and from people who use screen readers, magnifiers, voice control or the keyboard.

## Name the carousel with a visible heading

Most screen reader users move through a page by headings, and a visible heading gets translated.

## Don't hide slides that are on screen

Hiding visible slides from screen readers locks out people who see the screen and also use speech, and people who use voice control. Hidden slides also disappear from the heading and link lists that screen reader users navigate with. The plugin hides only slides that are completely off-screen, and those leave the lists too. If people need to find every slide there, use [`hideOffscreen: false`](features.md#keeping-every-slide-reachable).

## Offer a way past long carousels

A keyboard user tabs through every link and button in the slides on screen, and with `hideOffscreen: false` through every slide. A [skip link](features.md#keeping-every-slide-reachable) before the carousel saves them the trip.

## Add buttons

Dragging must never be the only way to move the carousel (WCAG 2.5.7). Use real `<button>` elements with visible text, at least 24 by 24 pixels, and keep them visible when they have focus.

## Don't hide unavailable buttons with `opacity: 0`

A transparent button can still get focus, so keyboard users land on something they cannot see. If both buttons are unavailable and you want them gone, use `hidden` or `display: none`.

## Let people zoom

If you set `touch-action` on the carousel, keep `pinch-zoom` in it, for example `touch-action: pan-y pinch-zoom`. Without it, people with low vision cannot zoom into the slides on a touch screen.

## Keep the visible text as the button name

If a button says "Next", don't give it a different `aria-label`. Voice control users say what they see.

## Prefer text in the page over `aria-label`

Browsers translate text in the page. They translate an `aria-label` only sometimes, and never one that a script adds. Text rendered on the server also works before JavaScript runs.

## Avoid autoplay

Moving content is the most common complaint from disabled users, and it can make people with vestibular disorders feel sick. If you need it, put a [stop button](features.md#stop-button) before the slides. When someone interacts with the carousel, stop the rotation, and keep it stopped until the user starts it again. Don't start it when the user asks for reduced motion.

## Don't take over the arrow keys

Screen readers use them to read. Buttons and the Tab key are enough, so never listen for arrow keys on the slides or on the page. The one exception is [`dotKeys: true`](features.md#fewer-tab-stops-for-many-dots) for many dots: it reacts to the arrow keys only while a dot has focus, so screen readers in reading mode keep theirs.

## Keep announcements short

A screen reader should hear a short position such as "3 of 10" after the user moves the carousel, not the whole slide, and nothing while it moves by itself.

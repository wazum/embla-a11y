# Changelog

All notable changes to this project are listed here. The project follows [Semantic Versioning](https://semver.org).

## Unreleased

### Added

- A warning when the previous and next buttons or the dots have no announcer.
- A warning when a dot or an announcement for several slides would use the template for one.

### Fixed

- While AutoScroll runs, a slide that leaves the screen becomes `inert` in the same frame, not one frame later.
- The rotation button no longer says "Stop" after reduced motion turns on while the mouse is over the carousel. Pressing it then started the rotation.

## 1.0.0 (2026-10-20)

The first release. Works with Embla Carousel 8.6 and 9, in Chrome and Edge 110, Firefox 115 and Safari 16 and newer.

### Structure

- The smallest element around the viewport and all its controls becomes a named region. A named `<div>` gets `role="region"`. The plugin never takes over `<body>` or a landmark such as `<main>`.
- Slides that are plain `<div>` elements become a list, so screen readers hear the count and the position of each slide.
- `data-single-view` on the carousel while everything fits in one view, so pages can hide controls that have nothing to do.

### Keyboard, focus and screen readers

- Only slides on screen are reachable. Slides that are fully off-screen become `inert`, and list items keep their position and the full count. `hideOffscreen: false` keeps every slide reachable.
- Focus from the keyboard, screen readers, voice control and scripts brings its slide into view. A mouse or touch press and focus the browser restores do not move the carousel.
- When focused content disappears, focus moves to something nearby instead of the top of the page.
- Previous and next buttons get `aria-disabled` at the ends, so focus stays on them.
- The current dot gets `aria-current`. Dots without a name get one from a template in the markup or from `dotLabel`. Visible text, hidden text and image `alt` text are kept.
- `dotKeys: true` makes the dots one Tab stop, with the arrow keys, Home and End between them.

### Announcements

- After a user moves the carousel with a button, a dot or a drag, the position is announced once, politely, from a live region in the page. Nothing is said on load, on resize, during Autoplay or when focus moves the carousel. Moves a framework makes up to a second after the click are announced too.
- Templates in the markup, in the page's language: `{first}`, `{last}`, `{total}`, `{page}`, `{pages}`, `{heading}`, and `{slides}` with `data-announcement-wrapped` for loops that wrap around.
- The `announcement` callback receives the same values for translation libraries.

### Autoplay and AutoScroll

- Any focus or press inside the carousel stops the rotation for good. While a mouse is over the carousel, it pauses.
- People who prefer reduced motion get no rotation until they start it with the rotation button.
- The rotation button's text always says what pressing it will do, from the markup or `rotationLabel`. It gets `aria-disabled` when there is nothing to rotate.
- A rotation the user stopped stays stopped through resizes and when a framework swaps in a new plugin instance.

### For developers

- No English of its own: every text comes from your markup or your callbacks.
- Console warnings, once per carousel, for missing names, texts, buttons and markup problems. `warnings: false` switches them off.
- Safe with server rendering and the React, Vue and Solid wrappers.
- On destroy, every attribute and text goes back to what you wrote.
- `active`, `breakpoints` and `globalOptions` as in Embla.
- Exported types: `EmblaA11yType`, `EmblaA11yOptionsType`, `AnnouncementType`, `DotLabelType`, `RotationLabelType`.

### Known limits

- Works in the normal page DOM only, not inside a shadow root.
- NVDA counts only the slides on screen while off-screen slides are hidden, because it ignores `aria-setsize`.

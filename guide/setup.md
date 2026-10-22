# Setup

The [quick start](../README.md#quick-start) shows a complete carousel. This page covers the rest: where the controls go, Embla 8.6, other plugins, the console warnings, a page without a build step, server rendering and frameworks.

- [The carousel area](#the-carousel-area)
- [Click handlers and Embla 8.6](#click-handlers-and-embla-86)
- [Other Embla plugins](#other-embla-plugins)
- [Console warnings](#console-warnings)
- [Without a build step](#without-a-build-step)
- [Server rendering and frameworks](#server-rendering-and-frameworks)

## The carousel area

The plugin treats the smallest element around the viewport and all the controls you pass as the carousel. It becomes the region, and focus or a press inside it stops Autoplay. Keep the viewport and all its controls in one wrapper, like the `<section>` in the quick start. An extra wrapper around the viewport is fine; the plugin looks past it.

The plugin never takes over `<body>` or a landmark such as `<main>`. Then it uses the viewport or its parent, and warns in the console.

## Click handlers and Embla 8.6

You keep your own click handlers; the plugin never moves the carousel on a click. With Embla 9 they call `goToPrev`, `goToNext` and `goTo`. With Embla 8.6 the methods are `scrollPrev`, `scrollNext` and `scrollTo`.

## Other Embla plugins

List `emblaA11y` after Embla's other plugins, such as Autoplay or AutoScroll. [Keep focused content visible](features.md#keep-focused-content-visible) explains why.

## Console warnings

Keep the browser console open while you build the carousel. When your markup or options keep the plugin from making the carousel accessible, for example a missing name, a dot without text or Autoplay without a stop button, it warns there once per carousel and says how to fix it. It never fails silently, and it never fills the gap with English text of its own.

Switch the warnings off only after you have fixed what they say, for example for tests that fail on console output: `warnings: false` for one carousel, or `emblaA11y.globalOptions = { warnings: false }` for all of them.

## Without a build step

The plugin and Embla are plain JavaScript modules, so browsers load them directly from a CDN. An import map lets the JavaScript from the quick start run unchanged. Put that JavaScript in a file such as `carousel.js`, and load it as a module after the import map:

```html
<script type="importmap">
  {
    "imports": {
      "embla-carousel": "https://cdn.jsdelivr.net/npm/embla-carousel@9.0.0-rc04/esm/embla-carousel.esm.js",
      "embla-a11y": "https://cdn.jsdelivr.net/npm/embla-a11y@1.1.3/dist/index.js"
    }
  }
</script>
<script type="module" src="carousel.js"></script>
```

- Keep exact versions in the URLs, so no new release changes your page unseen. Update them on purpose, after reading the [changelog](../CHANGELOG.md).
- For Embla 8.6, use `embla-carousel@8.6.0/esm/embla-carousel.esm.js` and Embla 8's method names.
- Safari 16.0 to 16.3 have no import maps. For them, write the full URLs into the `import` lines of `carousel.js` instead of the names.
- To host the files yourself, download the package from npm, for example `https://registry.npmjs.org/embla-a11y/-/embla-a11y-1.1.3.tgz`, and serve its `dist` folder.

## Server rendering and frameworks

The plugin adds nothing on the server. The React, Vue and Solid wrappers also create an instance without a root element, and the plugin leaves that one alone too.

Render the section, heading, list and slides on the server, so the named region and its content are there before JavaScript runs. The carousel does not work before that: the buttons do nothing, and slides beyond the first view can only be reached with Tab. Hide the buttons, dots and rotation button until Embla has started, for example with a class you add after creating the carousel, so nobody presses a button that does nothing.

Pass the elements from refs. Embla's wrappers compare the plugin options on every render and re-initialise the carousel with a new plugin instance when an element changes, for example on the render after the first one, when the refs are filled. The plugin keeps what matters across that switch: a rotation the user stopped stays stopped, and a warning is not repeated. List `emblaA11y` last, as everywhere.

```jsx
const previous = useRef(null)
const next = useRef(null)
const [viewport, emblaApi] = useEmblaCarousel({}, [
  Autoplay(),
  emblaA11y({ previousButton: previous.current, nextButton: next.current })
])
```

> [!NOTE]
> This React snippet is an illustration and does not run in the test suite. What it relies on does: tests swap in a new plugin instance with new buttons the way the wrappers do, and check that the old buttons get their markup back and a stopped rotation stays stopped.

### Limits

The plugin works in the normal page DOM, not inside a shadow root. Inside a web component's shadow DOM it cannot see which element has focus, so focus could be lost when slides are hidden. For a carousel inside an iframe, create it with a script in the iframe, not in the parent page, for the same reason.

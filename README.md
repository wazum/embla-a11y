# embla-carousel-a11y

Accessibility plugin for [Embla Carousel](https://www.embla-carousel.com) v9.

Work in progress. Not published yet.

## Goals

- Never hide content that users can see.
- Users are in control of motion: no autoplay surprises, a pause that lasts, `prefers-reduced-motion` respected.
- Target: WCAG 2.2 AA, plus the AAA criteria a carousel can meet.
- Verified with automated tests in real browsers and with real screen readers (VoiceOver, NVDA, Orca).

See [docs/definition-of-done.md](docs/definition-of-done.md) for the success criteria and [docs/research](docs/research) for the research behind them.

## Usage

```ts
import EmblaCarousel from 'embla-carousel'
import A11y from 'embla-carousel-a11y'

EmblaCarousel(rootNode, {}, [A11y({ label: 'Featured products' })])
```

## Development

Browsers run in the official Playwright Docker image (`compose.yaml`). The test scripts start the container; tests on the host connect to it.

```sh
npm install
npm test                 # unit tests in real browsers (Vitest browser mode)
npm run test:e2e         # end-to-end tests with Playwright and axe
npm run browsers:stop    # stop the browser container
npm run demo             # demo pages, open /e2e/pages/index.html
npm run check            # formatting, lint, types, HTML, unused code, package exports
npm run format           # fix formatting
```

Git hooks (lefthook) run the checks on staged files before each commit and `npm run check` before each push.

When updating Playwright, update the image tag in `compose.yaml` and `.github/workflows/ci.yml` to the same version.

### Screen reader tests

Screen reader tests drive real VoiceOver, NVDA and Orca with [Guidepup](https://www.guidepup.dev). They run in CI. To run them locally, prepare the machine once (this changes macOS VoiceOver settings):

```sh
npx @guidepup/setup setup
npx @guidepup/setup install
npm run test:screenreader
```

The screen reader takes over the machine while the tests run.

## License

MIT

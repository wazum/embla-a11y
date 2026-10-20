# Contributing

## Setup

Browsers run in the official Playwright Docker image (`compose.yaml`). The test scripts start the container, and the tests on your machine connect to it.

```sh
npm install
npm install --prefix v8  # Embla 8.6 and its plugins, for the 8.6 tests
npm test                 # unit tests in real browsers
npm run test:e2e         # end-to-end tests with Playwright and axe
npm run test:v8          # unit tests against Embla 8.6
npm run test:e2e:v8      # end-to-end tests against Embla 8.6
npm run browsers:stop    # stop the browser container
npm run demo             # demo pages at /e2e/pages/index.html
npm run check            # formatting, lint, types, HTML, unused code, package exports
npm run format           # fix formatting
```

Git hooks check staged files before each commit and run `npm run check` before each push.

Embla 9 is the main version. Everything for Embla 8.6 lives in `src/compat/`: it gives an 8.6 instance the Embla 9 methods the plugin uses. Embla 8.6 and its plugins for the tests are a separate package in `v8/`, because their peer dependencies cannot be installed next to Embla 9. With `EMBLA=8`, Vite and Vitest load them from there.

Code examples in the README and the guides live in `examples/`. `test/examples.test.ts` runs them, and `test/docs.test.ts` fails when a `js`, `ts` or `html` block in the docs is not in one of those files word for word, apart from indentation. Blocks with `…` are left out. Change the example file and copy the block from there.

When you update Playwright, use the same version in the image tag in `compose.yaml` and `.github/workflows/ci.yml`.

## Screen reader tests

These tests drive real VoiceOver, NVDA and Orca with [Guidepup](https://www.guidepup.dev). They run in CI. To run them on your machine, prepare it once. This changes the VoiceOver settings on macOS.

```sh
npx @guidepup/setup setup
npx @guidepup/setup install
npm run test:screenreader
```

The screen reader takes over the machine while the tests run.

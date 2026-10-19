# Contributing

## Setup

Browsers run in the official Playwright Docker image (`compose.yaml`). The test scripts start the container, and the tests on your machine connect to it.

```sh
npm install
npm test                 # unit tests in real browsers
npm run test:e2e         # end-to-end tests with Playwright and axe
npm run browsers:stop    # stop the browser container
npm run demo             # demo pages at /e2e/pages/index.html
npm run check            # formatting, lint, types, HTML, unused code, package exports
npm run format           # fix formatting
```

Git hooks check staged files before each commit and run `npm run check` before each push.

When you update Playwright, use the same version in the image tag in `compose.yaml` and `.github/workflows/ci.yml`.

## Screen reader tests

These tests drive real VoiceOver, NVDA and Orca with [Guidepup](https://www.guidepup.dev). They run in CI. To run them on your machine, prepare it once. This changes the VoiceOver settings on macOS.

```sh
npx @guidepup/setup setup
npx @guidepup/setup install
npm run test:screenreader
```

The screen reader takes over the machine while the tests run.

# Options

All options are optional. Elements you don't pass turn their feature off. The [features guide](features.md) shows each option with its markup.

| Option           | Type                                                            | Default | Purpose                                                                                                                          |
| ---------------- | --------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `previousButton` | `HTMLElement`                                                   | `null`  | [Previous button](features.md#previous-and-next-buttons), marked unavailable at the start                                        |
| `nextButton`     | `HTMLElement`                                                   | `null`  | [Next button](features.md#previous-and-next-buttons), marked unavailable at the end                                              |
| `dots`           | `HTMLElement`                                                   | `null`  | Element that holds the [dot buttons](features.md#dot-buttons)                                                                    |
| `announcer`      | `HTMLElement`                                                   | `null`  | Live region for [position announcements](features.md#position-announcements)                                                     |
| `rotationButton` | `HTMLElement`                                                   | `null`  | Button that [starts and stops](features.md#stop-button) Autoplay or AutoScroll; needed with either                               |
| `hideOffscreen`  | `boolean`                                                       | `true`  | Makes slides that are fully off-screen `inert`; [`false` keeps every slide reachable](features.md#keeping-every-slide-reachable) |
| `labelledBy`     | `string`                                                        | `null`  | Id of a visible heading, if the markup has no [name](features.md#carousel-name)                                                  |
| `label`          | `string`                                                        | `null`  | Text name, if there is no visible heading                                                                                        |
| `dotLabel`       | `(first, last, page, pages) => string`                          | `null`  | Dot names from your translation library, instead of markup                                                                       |
| `dotKeys`        | `boolean`                                                       | `false` | [Only the current dot is a Tab stop; arrow keys move between dots](features.md#fewer-tab-stops-for-many-dots)                    |
| `announcement`   | `(first, last, total, page, pages, slides, headings) => string` | `null`  | Announcement text from your translation library                                                                                  |
| `rotationLabel`  | `(playing) => string`                                           | `null`  | Rotation button text from your translation library                                                                               |
| `active`         | `boolean`                                                       | `true`  | [Turns the plugin off](features.md#turn-off-and-clean-up), also per media query                                                  |
| `breakpoints`    | `Record<string, options>`                                       | `{}`    | Options per media query, as in Embla                                                                                             |
| `warnings`       | `boolean`                                                       | `true`  | [Console warnings](setup.md#console-warnings) about missing names, texts and buttons                                             |

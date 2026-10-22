# Design decisions

Each record has the context, the decision, its consequences and the sources. The [features guide](../guide/features.md) says how to use each feature.

1. [Slides are a list](0001-slides-are-a-list.md): a list, not groups named "Slide 3 of 10".
2. [Off-screen slides are inert](0002-off-screen-slides-are-inert.md): only slides on screen can be reached.
3. [Dots are buttons, and focus stays on them](0003-dots-are-buttons.md): plain buttons with `aria-current`, not tabs.
4. [Interaction stops the rotation until the user starts it again](0004-interaction-stops-rotation-for-good.md): focus or a press stops Autoplay and AutoScroll, and only the rotation button starts them again.
5. [One announcer, after the user's moves](0005-one-announcer.md): one live region says a short position, and the slides get no `aria-live`.
6. [No text of its own](0006-no-text-of-its-own.md): every text comes from the page, in its language.

# Interaction stops the rotation for good

Status: accepted

With Autoplay or AutoScroll, any focus or press inside the carousel stops the rotation for good. Only the rotation button starts it again. A mouse over the carousel only pauses it, until the mouse leaves. With reduced motion, the rotation does not start. Without a rotation button, the plugin warns.

This follows the ARIA Authoring Practices: the rotation "Stops rotating when keyboard focus enters the carousel." and "It does not restart unless the user explicitly requests it to do so." [1] WCAG agrees: "Having an animation stop only so long as a user has focus on it" is no way to pause, and paused means "not resumed until requested by user". [2]

The W3C examples differ. One example resumes: "Automatic rotation resumes when keyboard focus moves out of the carousel content". [3] The plugin follows the pattern and WCAG instead.

The mouse pause follows the pattern too: it "Stops rotating whenever the mouse is hovering over the carousel." [1] It resumes, because people with screen magnifiers move the mouse all the time. Sarah Higley: "moving the mouse to zoom around the photo pauses and it would be very hard to resume". [4]

Reduced motion matters because motion can cause "nausea, migraine headaches, and potentially needing bed rest to recover". [5] A W3C example does the same: "auto-rotation will always be paused on load". [6]

## Consequences

- Screen reader users who read without moving focus do not stop the rotation. For them the rotation button is the only way.
- Focus that a script sets inside the carousel stops the rotation too.

## Sources

1. W3C WAI, [ARIA Authoring Practices: Carousel Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)
2. W3C WAI, [Understanding SC 2.2.2: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
3. W3C WAI, [Auto-Rotating Image Carousel Example](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/examples/carousel-1-prev-next/), 12 August 2025
4. ARIA Authoring Practices Task Force, [minutes](https://www.w3.org/2020/02/11-aria-apg-minutes.html), 11 February 2020
5. W3C WAI, [Understanding SC 2.3.3: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
6. W3C WAI, [Auto-Rotating Image Carousel with Tabs Example](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/examples/carousel-2-tablist/), 12 August 2025

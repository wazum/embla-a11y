import EmblaCarousel from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'
import emblaA11y from 'embla-a11y'

const emblaApi = EmblaCarousel(document.body, {}, [emblaA11y({ label: 'Products' }), Autoplay()])
emblaApi.plugins().autoplay.play()

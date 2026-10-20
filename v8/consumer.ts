import EmblaCarousel from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'
import emblaA11y, {
  type AnnouncementType,
  type DotLabelType,
  type RotationLabelType
} from 'embla-a11y'

const dotLabel: DotLabelType = (first, last) => `Slides ${first} to ${last}`
const announcement: AnnouncementType = (first, last, total) => `${first} to ${last} of ${total}`
const rotationLabel: RotationLabelType = (playing) => `Playing: ${String(playing)}`

const emblaApi = EmblaCarousel(document.body, {}, [
  emblaA11y({ label: 'Products', dotLabel, announcement, rotationLabel }),
  Autoplay()
])
emblaApi.plugins().autoplay.play()

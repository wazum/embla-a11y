import EmblaCarousel from 'embla-carousel'
import A11y from '../../src/index'

const root = document.querySelector<HTMLElement>('.embla')
if (root === null) throw new Error('Carousel root not found')

EmblaCarousel(root, {}, [A11y({ label: 'Featured products' })])

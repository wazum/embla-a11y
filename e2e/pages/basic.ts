import EmblaCarousel from 'embla-carousel'
import A11y from '../../src/index'

const root = document.querySelector<HTMLElement>('.embla')!

EmblaCarousel(root, {}, [A11y({ label: 'Featured products' })])

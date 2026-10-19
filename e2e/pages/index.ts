import { variants } from '../variants.js'

const list = document.querySelector('#variants')
if (list === null) throw new Error('Variant list not found')

list.append(
  ...variants.map((variant) => {
    const item = document.createElement('li')
    const link = document.createElement('a')
    link.href = `carousel.html?variant=${variant.name}`
    link.textContent = variant.name
    item.append(link, `: ${variant.description}`)
    return item
  })
)

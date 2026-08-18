export default function init(block) {
  const rows = block.querySelectorAll(':scope > div')

  rows.forEach(row => {
    row.classList.add('social-item')

    const picture = row.querySelector('picture').cloneNode(true)
    const link = row.querySelector('a').cloneNode(true)

    row.innerHTML = ''

    if (link) {
      const hash = link.href.split('#')[1]
      if (hash &&
        (hash.toLowerCase() === 'blank' || hash.toLowerCase() === 'self')
      ) {
        link.target = `_${hash}`
        link.href = link.href.split('#')[0]
      } else {
        link.target = '_blank'
      }

      link.textContent = ''
      link.appendChild(picture)

      row.appendChild(link)
    } else {
      row.appendChild(picture)
    }
  })
}

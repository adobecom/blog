import { getLibs } from '../../scripts/utils.js';

function decorateRow(row, createTag) {
  const columns = Array.from(row.children);
  const firstColumn = columns[0];
  const secondColumn = columns[1];
  const image = firstColumn.querySelector('img');
  const { href } = firstColumn.querySelector('a');
  const icon = createTag('img', { src: '/blocks/toolkit/link-icon.svg', alt: 'open in a new tab', width: '18px', height: '18px' });
  const link = createTag('a', { href, target: '_blank' });

  row.classList.add('row');

  if (!image) {
    throw new Error('Expected image');
  }

  if (!href) {
    throw new Error('Expected link');
  }

  firstColumn.innerHTML = '';
  firstColumn.append(image);
  firstColumn.classList.add('row-image');
  secondColumn.classList.add('row-content');

  const cta = secondColumn.querySelector('a');

  if (cta) {
    cta.classList.add('con-button', 'blue');
    cta.target = '_blank';
  } else {
    secondColumn.querySelector('h2').append(icon);
    row.parentElement.append(link);
    link.append(row);
  }
}

function decorateCTARow(row) {
  row.classList.add('ctas');
  const links = row.querySelectorAll('a');

  if (!links || links.length === 0) {
    return;
  }

  links[0]?.classList.add('con-button', 'button-s', 'outline');
  links[1]?.classList.add('con-button', 'button-s', 'blue');
}

export default async function init(block) {
  const miloLibs = getLibs();
  const { createTag } = await import(`${miloLibs}/utils/utils.js`);
  const rows = Array.from(block.children);
  let wrapper;

  rows.forEach((row) => {
    const columns = Array.from(row.children);
    if (columns.length === 2) {
      if (!wrapper) {
        wrapper = createTag('div', { class: 'wrapper' });
        block.append(wrapper);
      }

      wrapper.append(row);

      if (columns[0].innerHTML) {
        decorateRow(row, createTag);
      } else {
        decorateCTARow(row);
      }
    } else {
      row.classList.add('column');
      if (columns.length < 2) {
        row.classList.add('single');
      }
      block.append(row);
    }
  });
}

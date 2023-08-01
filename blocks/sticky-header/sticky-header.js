import { getLibs } from '../../scripts/utils.js';

export default async function decorate(block) {
  const { createTag } = await import(`${getLibs()}/utils/utils.js`);
  const header = document.querySelector('header');
  const div = block.firstElementChild;
  const a = block.querySelector('a');
  const close = createTag('a', { class: 'sticky-header-close' });
  const closeIcon = createTag('img', { class: 'sticky-header-close-icon', src: '/blocks/sticky-header/close.svg' });

  header.parentNode.insertBefore(block, header.nextElementSibling);

  a.classList.add('button');
  a.target = '_blank';

  close.addEventListener('click', () => {
    block.remove();
  });

  div.append(close);
  close.append(closeIcon);
}

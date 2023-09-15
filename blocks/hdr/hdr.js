import { getLibs } from '../../scripts/utils.js';

function getMediaFilename(a) {
  try {
    const mediaUrl = new URL(a.href);
    return mediaUrl.pathname;
  } catch (e) {
    console.log('Error parsing media url', e);
  }
  return '';
};

export default async function init(el) {
  const links = el.querySelectorAll(':scope a');
  if (!links.length) return;

  const { createTag } = await import(`${getLibs()}/utils/utils.js`);
  const caption = el.querySelector(':scope em');
  const container = createTag('div', { class: 'hdr-container' }, null);
  el.innerHTML = '';

  if(links.length > 1) {
    container.classList.add('multiple');
  }
  el.append(container);

  links.forEach((link) => {
    const img = document.createElement('img');

    img.src = getMediaFilename(link);
    img.setAttribute('loading', 'lazy');
    container.append(img);
    link.remove();
  });

  if(!caption) return;
  const para = document.createElement('p');

  para.classList.add('caption');
  para.append(caption);
  el.append(para);
}

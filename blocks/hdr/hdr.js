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
  const links = el.querySelectorAll('a[href*=".jpg"], a[href*=".png"]');
  if (!links.length) return;

  const { createTag } = await import(`${getLibs()}/utils/utils.js`);
  const caption = el.querySelector(':scope em');
  const container = createTag('div', { class: 'hdr-container' }, null);
  el.innerHTML = '';

  if (links.length > 1) {
    container.classList.add('multiple');
  }
  el.append(container);

  links.forEach((link, idx) => {
    const img = createTag('img', { loading: 'lazy' }, null);

    if (idx === 1) {
      img.classList.add('hdr-image');
    }

    img.src = getMediaFilename(link);
    container.append(img);
    link.remove();
  });

  if (!caption) return;
  const para = createTag('p', { class: 'caption'}, null);

  para.append(caption);
  el.append(para);
}

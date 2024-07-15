import { getLibs } from '../../../scripts/utils.js';

function showBanner(url, createTag) {
  document.querySelector('.predict-banner')?.remove();
  const text = createTag('p', { class: 'predict-text' }, `Predicted URL: ${url}`);
  const copy = createTag('button', { class: 'con-button predict-copy' }, 'Copy');
  const close = createTag('button', { class: 'con-button predict-close' }, 'Close');
  const banner = createTag('div', { class: 'dark predict-banner' }, [text, copy, close]);
  document.body.append(banner);

  copy.addEventListener('click', () => {
    navigator.clipboard.writeText(url);
    banner.remove();
  });

  close.addEventListener('click', () => {
    banner.remove();
  });
}

export default async function predictUrl() {
  const pathSplit = window.location.pathname.split('/');
  const page = pathSplit.pop();
  const { getMetadata, createTag, loadStyle } = await import(`${getLibs()}/utils/utils.js`);
  loadStyle('/tools/sidekick/predicturl/predicturl.css');
  const date = getMetadata('publication-date');
  let publishPath = '';
  if (date) {
    const [month, day, year] = date.split('-');
    if (month && day && year) publishPath = `/publish/${year}/${month}/${day}`;
  }
  const url = `https://blog.adobe.com/${pathSplit[1]}${publishPath}/${page}`;
  showBanner(url, createTag);
}

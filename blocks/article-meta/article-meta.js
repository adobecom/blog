import { getLibs, buildBlock, replacePlaceholderForLocalizedText } from '../../scripts/utils.js';

async function validateAuthorUrl(url) {
  if (!url) return null;

  const resp = await fetch(`${url.toLowerCase()}.plain.html`);
  if (!resp?.ok) {
    console.log(`Could not retrieve metadata for ${url}`);
    return null;
  }

  const html = await resp.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  return doc;
}

async function validateDate(date) {
  const miloLibs = getLibs();
  const { getConfig } = await import(`${miloLibs}/utils/utils.js`);
  const { env } = getConfig();

  if (env?.name === 'prod') return;
  if (date && !/^[0-1]\d{1}-[0-3]\d{1}-[2]\d{3}$/.test(date.textContent.trim())) {
    // match publication date to MM-DD-YYYY format
    date.classList.add('article-date-invalid');
    date.setAttribute('title', await replacePlaceholderForLocalizedText('invalid-date'));
  }
}

async function buildAuthorInfo(authorEl, bylineContainer) {
  const miloLibs = getLibs();
  const { createTag, getConfig } = await import(`${miloLibs}/utils/utils.js`);

  const { href, textContent } = authorEl;

  const config = getConfig();
  const base = config.miloLibs || config.codeRoot;
  const authorImg = createTag('div', { class: 'article-author-image' });
  authorImg.style.backgroundImage = `url(${base}/blocks/article-header/adobe-logo.svg)`;
  bylineContainer.prepend(authorImg);

  const doc = await validateAuthorUrl(href);
  if (!doc) {
    const p = createTag('p', null, textContent);
    authorEl.replaceWith(p);
    return;
  }

  const img = doc.querySelector('img');
  if (img) {
    img.setAttribute('alt', authorEl.textContent);
    authorImg.append(img);
    if (!img.complete) {
      img.addEventListener('load', () => {
        authorImg.style.backgroundImage = 'none';
      });
      img.addEventListener('error', () => {
        img.remove();
      });
    } else {
      authorImg.style.backgroundImage = 'none';
    }
  }
}

export function initCopyLinkButtonFunction(block) {
  const copyButton = block.querySelector('.copy-to-clipboard')
  if (!copyButton) return false;

  copyButton.addEventListener('click', (e) => {
    e.preventDefault();

    navigator.clipboard.writeText(window.location.href).then(() => {
      copyButton.classList.add('copy-to-clipboard-copied');
      setTimeout(() => document.activeElement.blur(), 500);
      setTimeout(
        () => copyButton.classList.remove('copy-to-clipboard-copied'),
        2000,
      );
    });
  });
}

export default async function init(blockEl) {
  const childrenEls = Array.from(blockEl.children);
  if (childrenEls.length < 1) {
    console.warn('Block does not have enough children');
  }

  // build author info
  const bylineContainer = childrenEls[0];
  bylineContainer.classList.add('article-byline');
  bylineContainer.firstElementChild.classList.add('article-byline-info');

  const authorContainer = bylineContainer.firstElementChild.firstElementChild;
  const authorEl = authorContainer.querySelector('a');
  authorContainer.classList.add('article-author');

  await buildAuthorInfo(authorEl, bylineContainer);

  const date = bylineContainer.querySelector('.article-byline-info > p:last-child');
  date.classList.add('article-date');
  await validateDate(date);

  // build link sharing
  const miloLibs = getLibs();
  const { getMetadata } = await import(`${miloLibs}/utils/utils.js`);
  const miloShareModule = await import(`${miloLibs}/blocks/share/share.js`);
  const initMiloShareBlock = miloShareModule.default;
  
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.querySelector('h1').textContent);
  const description = encodeURIComponent(getMetadata('description'));

  const platformLinks = {
    twitter: `https://www.twitter.com/share?&url=${url}&text=${title}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${description || ''}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`
  }

  const miloShareBlock = buildBlock('share', [
    [
      {
        elems: [
          `<a href="${platformLinks.twitter}"> Twitter </a>`,
          `<a href="${platformLinks.linkedin}"> Linkedin </a>`,
          `<a href="${platformLinks.facebook}"> Facebook </a>`,
        ]
      }
    ],
  ]);
  await initMiloShareBlock(miloShareBlock);

  const trackingHeader = miloShareBlock.querySelector('.tracking-header');
  if (trackingHeader) trackingHeader.innerHTML = "";

  bylineContainer.append(miloShareBlock);
}

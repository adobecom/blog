import { getLibs } from '../../scripts/utils.js';

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

function openPopup(e) {
  const target = e.target.closest('a');
  const href = target.getAttribute('data-href');
  const type = target.getAttribute('data-type');
  window.open(
    href,
    type,
    'popup,top=233,left=233,width=700,height=467',
  );
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

export async function initSharingLinkFunction(sharing) {
  const miloLibs = getLibs();
  const { getConfig } = await import(`${miloLibs}/utils/utils.js`);
  const { replaceKey } = await import(`${miloLibs}/features/placeholders.js`);
  const { copyToClipboard } = await import(`${miloLibs}/utils/tools.js`);

  const sharingLinks = sharing.querySelectorAll('[data-href]');
  if (!sharingLinks) return;

  sharingLinks.forEach((link) => {
    link.addEventListener('click', openPopup);
  });
  const copyButton = sharing.querySelector('#copy-to-clipboard');
  copyButton.addEventListener('click', async () => {
    const copyText = await replaceKey('copied-to-clipboard', getConfig());
    await copyToClipboard(copyButton, copyText);
  });
}

export async function buildSharing() {
  const miloLibs = getLibs();
  const { createTag, getMetadata, getConfig } = await import(`${miloLibs}/utils/utils.js`);
  const { replaceKey } = await import(`${miloLibs}/features/placeholders.js`);
  const { fetchIcons } = await import(`${miloLibs}/features/icons/icons.js`);

  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.querySelector('h1').textContent);
  const description = encodeURIComponent(getMetadata('description'));

  const platformMap = {
    twitter: {
      'data-href': `https://www.twitter.com/share?&url=${url}&text=${title}`,
      alt: `${await replaceKey('share-twitter', getConfig())}`,
      'aria-label': `${await replaceKey('share-twitter', getConfig())}`,
    },
    linkedin: {
      'data-type': 'LinkedIn',
      'data-href': `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${description || ''}`,
      alt: `${await replaceKey('share-linkedin', getConfig())}`,
      'aria-label': `${await replaceKey('share-linkedin', getConfig())}`,
    },
    facebook: {
      'data-type': 'Facebook',
      'data-href': `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      alt: `${await replaceKey('share-facebook', getConfig())}`,
      'aria-label': `${await replaceKey('share-facebook', getConfig())}`,
    },
    link: {
      id: 'copy-to-clipboard',
      alt: `${await replaceKey('copy-to-clipboard', getConfig())}`,
      'aria-label': `${await replaceKey('copy-to-clipboard', getConfig())}`,
    },
  };

  const platforms = Object.keys(platformMap);
  const svgs = await fetchIcons(getConfig());
  const allAnchorTags = platforms.map((platform) => {
    const platformProperties = platformMap[platform];
    if (platformProperties) {
      return createTag('a', platformProperties, svgs[platform].cloneNode(true));
    }
    return null;
  }).filter(Boolean);

  const sharing = createTag('div', { class: 'article-byline-sharing' });
  allAnchorTags.forEach((anchorTag) => {
    const span = createTag('span', null, anchorTag);
    sharing.append(span);
  });

  await initSharingLinkFunction(sharing);

  return sharing;
}

async function validateDate(date) {
  const miloLibs = getLibs();
  const { getConfig } = await import(`${miloLibs}/utils/utils.js`);
  const { replaceKey } = await import(`${miloLibs}/features/placeholders.js`);

  const { env } = getConfig();
  if (env?.name === 'prod') return;
  if (date && !/^[0-1]\d{1}-[0-3]\d{1}-[2]\d{3}$/.test(date.textContent.trim())) {
    // match publication date to MM-DD-YYYY format
    date.classList.add('article-date-invalid');
    date.setAttribute('title', await replaceKey('invalid-date', getConfig()));
  }
}

export default async function init(blockEl) {
  const childrenEls = Array.from(blockEl.children);
  if (childrenEls.length < 1) {
    console.warn('Block does not have enough children');
  }

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

  const shareBlock = await buildSharing();
  bylineContainer.append(shareBlock);
}

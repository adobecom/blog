/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * The decision engine to decide where to get Milo's libs from.
 */
export const [setLibs, getLibs] = (() => {
  let libs;
  return [
    (prodLibs, location) => {
      libs = (() => {
        const { hostname, search } = location || window.location;
        if (!(hostname.includes('.hlx.') || hostname.includes('local'))) return prodLibs;
        const branch = new URLSearchParams(search).get('milolibs') || 'main';
        if (branch === 'local') return 'http://localhost:6456/libs';
        return branch.includes('--') ? `https://${branch}.hlx.live/libs` : `https://${branch}--milo--adobecom.hlx.live/libs`;
      })();
      return libs;
    }, () => libs,
  ];
})();

/**
 * Normalizes all headings within a container element.
 * @param {Element} el The container element
 * @param {array} allowedHeadings The list of allowed headings (h1 ... h6)
 */
export function normalizeHeadings(el, allowedHeadings) {
  const allowed = allowedHeadings.map((h) => h.toLowerCase());
  el.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((tag) => {
    const h = tag.tagName.toLowerCase();
    if (allowed.indexOf(h) === -1) {
      // current heading is not in the allowed list -> try first to "promote" the heading
      let level = parseInt(h.charAt(1), 10) - 1;
      while (allowed.indexOf(`h${level}`) === -1 && level > 0) {
        level -= 1;
      }
      if (level === 0) {
        // did not find a match -> try to "downgrade" the heading
        while (allowed.indexOf(`h${level}`) === -1 && level < 7) {
          level += 1;
        }
      }
      if (level !== 7) {
        tag.outerHTML = `<h${level}>${tag.textContent}</h${level}>`;
      }
    }
  });
}

/**
 * Returns a picture element with webp and fallbacks
 * @param {string} src The image URL
 * @param {string} alt The image alt text
 * @param {boolean} eager load image eager
 * @param {Array} breakpoints breakpoints and corresponding params (eg. width)
 */
export function createOptimizedPicture(
  src,
  alt = '',
  eager = false,
  breakpoints = [{ media: '(min-width: 400px)', width: '2000' }, { width: '750' }],
) {
  const url = new URL(src, window.location.href);
  const picture = document.createElement('picture');
  const { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('src', `${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
    }
  });

  return picture;
}

/*
 * ------------------------------------------------------------
 * Edit below at your own risk
 * ------------------------------------------------------------
 */

export function getImageCaption(picture) {
  // Check if the parent element has a caption
  const parentEl = picture.parentNode;
  let caption = parentEl.querySelector('em');
  if (caption) return caption;

  // If the parent element doesn't have a caption, check if the next sibling does
  const parentSiblingEl = parentEl.nextElementSibling;
  caption = parentSiblingEl
    && !parentSiblingEl.querySelector('picture')
    && parentSiblingEl.firstChild?.tagName === 'EM'
    ? parentSiblingEl.querySelector('em')
    : '';
  return caption;
}

/*
  * Topic pages have a unique page header.
  * Transform it into a Milo marquee with custom blog "mini" variant.
*/
async function topicHeader(createTag) {
  const imageEl = document.querySelector('main > div:first-of-type > p > picture');
  if (!imageEl) return;

  const heading = document.querySelector('main > div > p + h1, main > div > p + h2, main > div > h1, main > div > h2');
  const container = createTag('div', { class: 'marquee mini' });
  const background = createTag('div', { class: 'background' }, imageEl);
  const text = createTag('div', {}, heading);
  const foreground = createTag('div', { class: 'foreground' }, text);
  const para = document.querySelector('main > div > p');
  container.append(background, foreground);
  para.replaceWith(container);
}

export async function decorateContent() {
  const miloLibs = getLibs();
  const imgEls = document.querySelectorAll('main > div > p > picture');
  if (!imgEls.length) return;

  const { createTag, loadStyle } = await import(`${miloLibs}/utils/utils.js`);
  loadStyle(`${miloLibs}/blocks/figure/figure.css`);

  if (window.location.pathname.includes('/topics/')) return topicHeader(createTag);
  if (window.location.pathname.includes('/authors/')) return;

  imgEls.forEach((imgEl) => {
    const block = createTag('div', { class: 'figure' });
    const row = createTag('div');
    const caption = getImageCaption(imgEl);
    const parentEl = imgEl.closest('p');

    if (caption) {
      const picture = createTag('p', null, imgEl.cloneNode(true));
      const em = createTag('p', null, caption.cloneNode(true));
      const wrapper = createTag('div');
      wrapper.append(picture, em);
      row.append(wrapper);
      caption.remove();
    } else {
      const wrapper = createTag('div', null, imgEl.cloneNode(true));
      row.append(wrapper);
    }

    block.append(row.cloneNode(true));
    parentEl.replaceWith(block);
  });
}

/**
 * Builds a block DOM Element from a two dimensional array
 * @param {string} blockName name of the block
 * @param {any} content two dimensional array or string or object of content
 */
export function buildBlock(blockName, content) {
  const table = Array.isArray(content) ? content : [[content]];
  const blockEl = document.createElement('div');
  // build image block nested div structure
  blockEl.classList.add(blockName);
  table.forEach((row) => {
    const rowEl = document.createElement('div');
    row.forEach((col) => {
      const colEl = document.createElement('div');
      const vals = col.elems ? col.elems : [col];
      vals.forEach((val) => {
        if (val) {
          if (typeof val === 'string') {
            colEl.innerHTML += val;
          } else {
            colEl.appendChild(val);
          }
        }
      });
      rowEl.appendChild(colEl);
    });
    blockEl.appendChild(rowEl);
  });
  return (blockEl);
}

/**
 * * @param {HTMLElement} element
 * * @param {string} targetTag, like 'ul' or 'div'
 * result: return the new element with inner content of the element, desired tag and css class
 */
export function changeHTMLTag(el, targetTag, properties = {}) {
  const newEl = document.createElement(targetTag);
  Object.keys(properties).forEach((key) => {
    newEl.setAttribute(key, properties[key]);
  });

  newEl.innerHTML = el.innerHTML;
  el.replaceWith(newEl);

  return newEl;
}

/**
 * * @param {string} key key of the localized text
 * return localized text based on inputted key
 */
export async function replacePlaceholderForLocalizedText(key) {
  const miloLibs = getLibs();
  const [{ replaceKey }, { getConfig }] = await Promise.all([
    await import(`${miloLibs}/features/placeholders.js`),
    await import(`${miloLibs}/utils/utils.js`)
  ])  

  const result = await replaceKey(key, getConfig());

  return result;
}

/**
 * * @param {string} hexcode hexcode of color
 * return rgb color for reusing in rgba()
 */
export function hexToRgb(hex) {
  if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)) {
    console.warn(`Invalid hex color: ${hex}`);
    return false;
  }

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `${r} ${g} ${b}`;
}

export function hasDarkOrLightClass(element) {
  const darkLightClass = ['dark', 'light'];
  return darkLightClass.some(cls => element.classList.contains(cls));
}

function buildAuthorHeader(mainEl) {
  const div = mainEl.querySelector('div');
  const heading = div.querySelector('h1, h2');
  const bio = div.querySelector('h1 + p, h2 + p');
  const picture = div.querySelector('picture');
  const social = div.querySelector('h3');
  const socialLinks = social ? social.nextElementSibling : null;
  let title;

  if (heading.tagName !== 'H1') {
    title = document.createElement('h1');
    title.textContent = heading.textContent;
    title.id = heading.id;
    heading.replaceWith(title);
  }

  const authorHeading = title ? title : heading;
  const authorHeader = buildBlock('author-header', [
    [{
      elems: [
        authorHeading,
        picture.closest('p'),
        bio,
        social,
        socialLinks,
      ],
    }],
  ]);

  div.prepend(authorHeader);
}

export function getCircleGradientValue(str) {
  if (!str) return false;

  // Regular expression to match `circle-gradient(#hexcode - #hexcode)`
  const regex = /^circle-gradient\(#([A-Fa-f0-9]{6})\s*,\s*#([A-Fa-f0-9]{6})\)$/;
  const match = str.match(regex);

  return match ? [`#${match[1]}`, `#${match[2]}`] : false;
}

async function buildArticleMeta(mainEl) {
  const miloLibs = getLibs();
  const { getMetadata, getConfig } = await import(`${miloLibs}/utils/utils.js`);

  if (getMetadata('content-type') != 'article') return;

  const author = getMetadata('author') || 'Adobe Communications Team';
  const { codeRoot } = getConfig();
  const authorURL = getMetadata('author-url') || (author ? `${codeRoot}/authors/${author.replace(/[^0-9a-z]/gi, '-').toLowerCase()}` : null);

  const publicationDate = getMetadata('publication-date');

  const articleMeta = buildBlock('article-meta', [
    [`<p>${authorURL ? `<a href="${authorURL}">${author}</a>` : author}</p>
      <p>${publicationDate}</p>`],
  ]);

  const isSidebarLayout = getMetadata('page-template') === 'sidebar';
  if (!isSidebarLayout) articleMeta.classList.add('as-article-header');

  // put article meta (author + link sharings) in front of first content div
  const allContentDivs = mainEl.querySelectorAll(':scope > div');
  if (!allContentDivs) return;

  const contentBlock = [...allContentDivs].find((div) => !div.querySelector('.article-hero-banner') && div.querySelector('div'));
  if (!contentBlock) return;

  contentBlock.insertBefore(articleMeta, contentBlock.firstChild);
}

function buildTagsBlock() {
  const tagsArray = [...document.head.querySelectorAll('meta[property="article:tag"]')].map((el) => el.content) || [];

  const tagsBlock = buildBlock('tags', tagsArray.join(', '));
  const main = document.querySelector('main');
  const recBlock = main.querySelector('.recommended-articles');
  if (recBlock) {
    // Put tags block before recommended articles block
    if (recBlock.parentElement.childElementCount === 1) {
      recBlock.parentElement.previousElementSibling.append(tagsBlock);
    } else {
      recBlock.before(tagsBlock);
    }
  } else {
    main.lastElementChild.append(tagsBlock);
  }
}

async function buildProgressBar(mainEl) {
  if (!mainEl) return;
  const miloLibs = getLibs();
  const { loadBlock } = await import(`${miloLibs}/utils/utils.js`);

  const progressBar = buildBlock('progress-bar', '');
  loadBlock(progressBar);
}

export async function buildAutoBlocks() {
  const miloLibs = getLibs();
  const { getMetadata } = await import(`${miloLibs}/utils/utils.js`);
  const mainEl = document.querySelector('main');
  try {
    if (getMetadata('content-type') === 'article' && !mainEl.querySelector('.article-header')) {
      // NOTE: if article-hero-marquee block is present, it'll render split marquee, else it'll render the regular one
      await buildArticleMeta(mainEl);
      buildTagsBlock();
      await buildProgressBar(mainEl);
    } else if (getMetadata('content-type') === 'authors') {
      buildAuthorHeader(mainEl);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

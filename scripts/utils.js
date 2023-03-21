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
    (prodLibs) => {
      const { hostname } = window.location;
      if (!hostname.includes('hlx.page')
        && !hostname.includes('hlx.live')
        && !hostname.includes('localhost')) {
        libs = prodLibs;
      } else {
        const branch = new URLSearchParams(window.location.search).get('milolibs') || 'main';
        if (branch === 'local') {
          libs = 'http://localhost:6456/libs';
        } else if (branch.indexOf('--') > -1) {
          libs = `https://${branch}.hlx.page/libs`;
        } else {
          libs = `https://${branch}--milo--adobecom.hlx.page/libs`;
        }
      }
      return libs;
    }, () => libs,
  ];
})();

/*
 * ------------------------------------------------------------
 * Edit below at your own risk
 * ------------------------------------------------------------
 */

function getImageCaption(picture) {
  // Check if the parent element has a caption
  const parentEl = picture.parentNode;
  let caption = parentEl.querySelector('em');
  if (caption) return caption;

  // If the parent element doesn't have a caption, check if the next sibling does
  const parentSiblingEl = parentEl.nextElementSibling;
  caption = parentSiblingEl
    && !parentSiblingEl.querySelector('picture')
    && parentSiblingEl.firstChild.tagName === 'EM'
    ? parentSiblingEl.querySelector('em')
    : undefined;
  return caption;
}

export async function decorateContent() {
  const miloLibs = getLibs();
  const imgEls = document.querySelectorAll('main > div > p > picture');
  if (!imgEls.length) return;

  const { createTag, loadStyle } = await import(`${miloLibs}/utils/utils.js`);
  loadStyle(`${miloLibs}/blocks/figure/figure.css`);

  imgEls.forEach((imgEl) => {
    const block = createTag('div', { class: 'figure' });
    const row = createTag('div', null);
    const caption = getImageCaption(imgEl);
    const parentEl = imgEl.closest('p');

    if (!caption) {
      const wrapper = createTag('div', null, imgEl.cloneNode(true));
      row.append(wrapper);
    } else {
      const picture = createTag('p', null, imgEl.cloneNode(true));
      const em = createTag('p', null, caption.cloneNode(true));
      const wrapper = createTag('div', null);
      wrapper.append(picture, em);
      row.append(wrapper);
      caption.remove();
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
function buildBlock(blockName, content) {
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

function buildAuthorHeader(mainEl) {
  const div = mainEl.querySelector('div');
  const heading = mainEl.querySelector('h1');
  const bio = heading.nextElementSibling;
  const picture = mainEl.querySelector('picture');
  const social = mainEl.querySelector('h2');
  const socialLinks = social ? social.nextElementSibling : null;

  const authorHeader = buildBlock('author-header', [
    [{
      elems: [
        heading,
        picture.closest('p'),
        bio,
        social,
        socialLinks,
      ],
    }],
  ]);

  div.prepend(authorHeader);
}

async function buildArticleHeader(el) {
  const miloLibs = getLibs();
  const { getMetadata, getConfig } = await import(`${miloLibs}/utils/utils.js`);
  const { loadTaxonomy, getLinkForTopic, getTaxonomyModule } = await import(`${miloLibs}/blocks/article-feed/article-helpers.js`);
  if (!getTaxonomyModule()) {
    await loadTaxonomy();
  }
  const div = document.createElement('div');
  // div.setAttribute('class', 'section');
  const h1 = el.querySelector('h1');
  const picture = el.querySelector('picture');
  const tag = getMetadata('article:tag');
  const category = tag || 'News';
  const author = getMetadata('author');
  const { codeRoot } = getConfig();
  const authorURL = getMetadata('author-url') || (author ? `${codeRoot}/authors/${author.replace(/[^0-9a-z]/gi, '-')}` : null);
  const publicationDate = getMetadata('publication-date');

  const categoryTag = getLinkForTopic(category);

  const articleHeaderBlockEl = buildBlock('article-header', [
    [`<p>${categoryTag}</p>`],
    [h1],
    [`<p>${authorURL ? `<a href="${authorURL}">${author}</a>` : author}</p>
      <p>${publicationDate}</p>`],
    [picture],
  ]);
  div.append(articleHeaderBlockEl);
  el.prepend(div);
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

export async function buildAutoBlocks() {
  const miloLibs = getLibs();
  const { getMetadata } = await import(`${miloLibs}/utils/utils.js`);
  const mainEl = document.querySelector('main');
  try {
    if (getMetadata('content-type') === 'article' && !mainEl.querySelector('.article-header')) {
      await buildArticleHeader(mainEl);
      buildTagsBlock();
    } else if (getMetadata('content-type') === 'authors') {
      buildAuthorHeader(mainEl);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

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

import { decorateContent, setLibs, buildAutoBlocks } from './utils.js';

// Add project-wide styles here.
const STYLES = ['/styles/styles.css', '/styles/articles.css'];

// Use '/libs' if your live site maps '/libs' to milo's origin.
const LIBS = '/libs';

// Add any config options.
const CONFIG = {
  codeRoot: '/en',
  // contentRoot: '',
  imsClientId: 'theblog-helix',
  locales: {
    '': { ietf: 'en-US', tk: 'hah7vzn.css' },
    en: { ietf: 'en', tk: 'hah7vzn.css' },
    de: { ietf: 'de', tk: 'hah7vzn.css' },
    ko: { ietf: 'ko', tk: 'zfo3ouc' },
    es: { ietf: 'es', tk: 'oln4yqj.css' },
    fr: { ietf: 'fr', tk: 'vrk5vyv.css' },
    it: { ietf: 'it', tk: 'bbf5pok.css' },
    jp: { ietf: 'ja', tk: 'dvg6awq' },
    kr: { ietf: 'ko', tk: 'qjs5sfm' },
    br: { ietf: 'pt', tk: 'inq1xob.css' },
    'en/uk': { ietf: 'en', tk: 'hah7vzn.css' },
    'en/apac': { ietf: 'en', tk: 'hah7vzn.css' },
  },
};

// Default to loading the first image as eager.
async function loadLCPImage() {
  const lcpImg = document.querySelector('main img');
  lcpImg?.setAttribute('loading', 'eager');
}

/**
 * Normalizes all headings within a container element.
 * @param {Element} el The container element
 * @param {[string]]} allowedHeadings The list of allowed headings (h1 ... h6)
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
 * @param {boolean} eager load image eager
 * @param {Array} breakpoints breakpoints and corresponding params (eg. width)
 */
export function createOptimizedPicture(src, alt = '', eager = false, breakpoints = [{ media: '(min-width: 400px)', width: '2000' }, { width: '750' }]) {
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

const miloLibs = setLibs(LIBS);

(async function loadStyles() {
  const paths = [`${miloLibs}/styles/styles.css`];
  const { getMetadata } = await import(`${miloLibs}/utils/utils.js`);

  if (STYLES) {
    paths.push(...(Array.isArray(STYLES) ? STYLES : [STYLES]));
  }

  function createStyleLink(path) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', path);
    document.head.appendChild(link);
  }

  paths.forEach((path) => {
    // Load article.css only for article pages
    if (getMetadata('content-type') === 'article' && path.includes('/articles.css')) {
      createStyleLink(path);
    }
    // Load style.css for all pages
    if (!path.includes('/articles.css')) {
      createStyleLink(path);
    }
  });
}());

function decorateFigure() {
  const imagesBlocks = document.querySelectorAll('.images, .image, .infograph, .infographic');
  imagesBlocks.forEach((block) => {
    if (block.classList.contains('infograph') || block.classList.contains('infographic')) {
      const img = block.querySelector(':scope picture > img');
      img.classList.add('infograph');
    }
    // eslint-disable-next-line no-unused-expressions
    block.classList.remove('images') || block.classList.remove('image') || block.classList.remove('infograph') || block.classList.remove('infographic');
    block.classList.add('figure');
  });
}

function decorateVideo() {
  const videoBlocks = document.querySelectorAll('.embed, .video, .animation');
  videoBlocks.forEach((block) => {
    const link = block.querySelector(':scope a');
    const videoCaption = block.querySelector(':scope p:last-of-type');
    const url = block.classList.contains('autoplay') || block.classList.contains('animation')
      ? `${link.href}#_autoplay`
      : link.href;
    const para = document.createElement('p');

    link.href = url;
    para.append(link);
    block.insertAdjacentElement('beforebegin', para);
    block.remove();

    if (!videoCaption) return;
    videoCaption.classList.add('video-caption');
    para.insertAdjacentElement('afterend', videoCaption);
  });
}

function decorateQuote() {
  const quoteBlocks = document.querySelectorAll('.pull-quote');
  quoteBlocks.forEach((block) => {
    const paras = block.querySelectorAll(':scope p');
    paras.forEach((p) => {
      if (p.innerHTML.startsWith('“') && p.innerHTML.endsWith('”')) {
        const quote = p.textContent;
        const blockquote = document.createElement('blockquote');
        blockquote.append(quote);
        p.insertAdjacentElement('afterend', blockquote);
        p.remove();
      }
    });
    block.classList.remove('pull-quote');
    block.classList.add('text', 'inset', 'quote');
  });
}

const { loadArea, setConfig } = await import(`${miloLibs}/utils/utils.js`);

(async function loadPage() {
  decorateFigure();
  decorateVideo();
  decorateQuote();
  decorateContent();
  setConfig({ ...CONFIG, miloLibs });
  await buildAutoBlocks();
  await loadArea();
  loadLCPImage();
}());

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
  // codeRoot: '',
  // contentRoot: '',
  imsClientId: 'theblog-helix',
  stage: {
    edgeConfigId: '72b074a6-76d2-43de-a210-124acc734f1c',
    marTechUrl: 'https://assets.adobedtm.com/d4d114c60e50/a0e989131fd5/launch-2c94beadc94f-development.min.js',
  },
  prod: {
    edgeConfigId: '913eac4d-900b-45e8-9ee7-306216765cd2',
  },
  locales: {
    '': { ietf: 'en-US', tk: 'hah7vzn.css' },
    en: { ietf: 'en-US', tk: 'hah7vzn.css' },
    de: { ietf: 'de', tk: 'hah7vzn.css' },
    ko: { ietf: 'ko', tk: 'zfo3ouc' },
    es: { ietf: 'es', tk: 'oln4yqj.css' },
    fr: { ietf: 'fr', tk: 'vrk5vyv.css' },
    it: { ietf: 'it', tk: 'bbf5pok.css' },
    jp: { ietf: 'ja-JP', tk: 'dvg6awq' },
    kr: { ietf: 'ko', tk: 'qjs5sfm' },
    br: { ietf: 'pt-BR', tk: 'inq1xob.css' },
    'en/uk': { ietf: 'en', tk: 'hah7vzn.css' },
    'en/apac': { ietf: 'en', tk: 'hah7vzn.css' },
  },
  stageDomainsMap: {
    'blog.stage.adobe.com': {
      'blog.adobe.com': 'origin',
    },
    '--blog--adobecom.hlx.live': {
      'blog.adobe.com': 'origin',
    },
    '--blog--adobecom.hlx.page': {
      'blog.adobe.com': 'origin',
    },
  },
};

// Milo blocks overridden by the Blog project
const OVERRIDE_MILO_BLOCKS = [{
  milo: 'table-of-contents',
  blog: 'blog-table-of-contents',
}, {
  milo: 'carousel',
  blog: 'blog-carousel',
}];

// Default to loading the first image as eager.
(async function loadLCPImage() {
  const lcpImg = document.querySelector('img');
  lcpImg?.setAttribute('loading', 'eager');
}());

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
    const para = document.createElement('p');
    const url = block.classList.contains('autoplay') || block.classList.contains('animation')
      ? `${link?.href}#_autoplay`
      : link?.href;
    if (!url) return;

    link.href = url;
    para.append(link);
    block.insertAdjacentElement('beforebegin', para);
    block.remove();

    if (!videoCaption) return;
    videoCaption.classList.add('video-caption');
    para.insertAdjacentElement('afterend', videoCaption);
  });
}

function getMediaFilename (a) {
  try {
    const mediaUrl = new URL(a.href);
    return mediaUrl.pathname.split('/').pop();
  } catch (e) {
    console.log('Error parsing media url', e);
  }
  return '';
};

function decorateGif() {
  const gifs = document.querySelectorAll(':scope p > a[href*=".gif"]');
  gifs.forEach((gif) => {
    const img = document.createElement('img');
    const picture = document.createElement('picture');

    img.src = getMediaFilename(gif);
    img.setAttribute('loading', 'lazy');
    picture.append(img);
    gif.parentElement.append(picture);
    gif.remove();
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

function overrideMiloBlocks() {
  OVERRIDE_MILO_BLOCKS.forEach((block) => {
    const miloBlocks = document.querySelectorAll(`.${block.milo}`);
    miloBlocks.forEach((miloBlock) => {
      miloBlock.classList.remove(block.milo);
      miloBlock.classList.add(block.blog);
    });
  });
}

function decorateTopicPage() {
  if (window.location.href.includes('/topics/')) {
    const sections = [...document.querySelectorAll('main > div')];
    if (sections.length = 1) {
      const articleFeed = document.querySelector('main div .article-feed');
      if (!articleFeed) return;
      const newSection = document.createElement('div');
      newSection.append(articleFeed);
      document.querySelector('main').append(newSection);
    }
  }
}

function initSidekick() {
  const initPlugins = async () => { await import('./sidekick.js'); };
  if (document.querySelector('helix-sidekick')) {
    initPlugins();
  } else {
    document.addEventListener('sidekick-ready', () => {
      initPlugins();
    });
  }
}

function decorateFeatImg(getMetadata) {
  const featImgMeta = getMetadata('blog-featured-image');
  if (featImgMeta === 'off') document.body.classList.add('hide-feat-img');
}

const { loadArea, setConfig, getMetadata } = await import(`${miloLibs}/utils/utils.js`);

(async function loadPage() {
  decorateFeatImg(getMetadata);
  decorateTopicPage();
  decorateFigure();
  decorateVideo();
  decorateQuote();
  decorateGif();
  await decorateContent();
  setConfig({ ...CONFIG, miloLibs });
  await buildAutoBlocks();
  overrideMiloBlocks();
  await loadArea();
  initSidekick();
}());

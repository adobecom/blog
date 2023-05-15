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
const STYLES = '/styles/styles.css';

// Use '/libs' if your live site maps '/libs' to milo's origin.
const LIBS = 'https://milo.adobe.com/libs';

// Add any config options.
const CONFIG = {
  // codeRoot: '',
  // contentRoot: '',
  // imsClientId: 'college',
  locales: {
    '': { ietf: 'en-US', tk: 'hah7vzn.css' },
    de: { ietf: 'de-DE', tk: 'hah7vzn.css' },
    ko: { ietf: 'ko-KR', tk: 'zfo3ouc' },
    es: { ietf: 'es-ES', tk: 'oln4yqj.css' },
    fr: { ietf: 'fr-FR', tk: 'vrk5vyv.css' },
    it: { ietf: 'it-IT', tk: 'bbf5pok.css' },
    jp: { ietf: 'ja-JP', tk: 'dvg6awq' },
    kr: { ietf: 'ko-KR', tk: 'qjs5sfm' },
    br: { ietf: 'pt-BR', tk: 'inq1xob.css' },
  },
};

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
  
  /* 
   * Currently only serving styles.css for article pages.
   * This is an effort to keep blog content simple to author with 
   * less section-metadata use for spacing.
   * Other pages are styled from blocks in Milo.
  */
  if (STYLES && getMetadata('content-type') === 'article') { paths.push(STYLES); }
  paths.forEach((path) => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', path);
    document.head.appendChild(link);
  });
}());

function decorateFigure() {
  const imagesBlocks = document.querySelectorAll('.images, .image, .infograph, .infographic');
  imagesBlocks.forEach((block) => {
    if (block.classList.contains('infograph') || block.classList.contains('infographic')) {
      const img = block.querySelector(':scope picture > img');
      img.classList.add('infograph');
    }
    block.classList.remove('images') || block.classList.remove('image') || block.classList.remove('infograph') || block.classList.remove('infographic');
    block.classList.add('figure');
  });
}

function decorateVideo() {
  const videoBlocks = document.querySelectorAll('.embed, .video, .animation');
  videoBlocks.forEach((block) => {
    const link =  block.querySelector(':scope a');
    const videoCaption =  block.querySelector(':scope p:last-of-type');
    const url = block.classList.contains('autoplay') || block.classList.contains('animation')
      ? `${link.href}#_autoplay`
      : link.href;
    const para =  document.createElement('p');

    link.href = url;
    para.append(link);
    block.insertAdjacentElement("beforebegin", para);
    block.remove();
    
    if (!videoCaption) return;
    videoCaption.classList.add('video-caption');
    para.insertAdjacentElement("afterend", videoCaption);
  });
}

const { loadArea, loadDelayed, setConfig } = await import(`${miloLibs}/utils/utils.js`);

(async function loadPage() {
  decorateFigure();
  decorateVideo();
  decorateContent();
  setConfig({ ...CONFIG, miloLibs });
  await buildAutoBlocks();
  await loadArea();
  loadDelayed();
}());

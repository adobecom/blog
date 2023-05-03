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
const STYLES = '';

// Use '/libs' if your live site maps '/libs' to milo's origin.
const LIBS = 'https://milo.adobe.com/libs';

// Add any config options.
const CONFIG = {
  // codeRoot: '',
  // contentRoot: '',
  // imsClientId: 'college',
  locales: {
    '': { ietf: 'en', tk: 'hah7vzn.css' },
    de: { ietf: 'de', tk: 'hah7vzn.css' },
    ko: { ietf: 'ko', tk: 'zfo3ouc' },
    es: { ietf: 'es', tk: 'oln4yqj.css' },
    fr: { ietf: 'fr', tk: 'vrk5vyv.css' },
    it: { ietf: 'it', tk: 'bbf5pok.css' },
    jp: { ietf: 'ja', tk: 'dvg6awq' },
    br: { ietf: 'pt', tk: 'inq1xob.css' },
    'en/uk': { ietf: 'en-GB', tk: 'hah7vzn.css' },
    'en/apac': { ietf: 'en', tk: 'hah7vzn.css' },
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

(function loadStyles() {
  const paths = [`${miloLibs}/styles/styles.css`];
  if (STYLES) { paths.push(STYLES); }
  paths.forEach((path) => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', path);
    document.head.appendChild(link);
  });
}());

function decorateFigure() {
  const imagesBlocks = document.querySelectorAll('.images');
  imagesBlocks.forEach((block) => {
    block.classList.remove('images');
    block.classList.add('figure');
  });
}

const { loadArea, loadDelayed, setConfig } = await import(`${miloLibs}/utils/utils.js`);

(async function loadPage() {
  decorateFigure();
  decorateContent();
  setConfig({ ...CONFIG, miloLibs });
  await buildAutoBlocks();
  await loadArea();
  loadDelayed();
}());

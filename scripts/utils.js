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
 * Edit above at your own risk
 * ------------------------------------------------------------
 */

export function decorateContent() {
  const miloLibs = getLibs();
  const topParas = document.body.querySelectorAll('main > div > p');
  topParas.forEach(async (p) => {
    // Figure candidate
    const picCandidate = p.firstElementChild;
    if (p.childElementCount === 1 && picCandidate.nodeName === 'PICTURE') {
      const captionCandidate = p.nextElementSibling;
      const { createTag, loadStyle } = await import(`${miloLibs}/utils/utils.js`);
      if (captionCandidate
        && captionCandidate.nodeName === 'P'
        && captionCandidate.childElementCount === 1
        && captionCandidate.firstChild.nodeName === 'EM') {
        const caption = createTag('figcaption', null, captionCandidate.firstElementChild);
        const figure = createTag('figure', { class: 'figure' }, [picCandidate, caption]);
        const block = createTag('div', { class: 'figure' }, figure);
        p.parentElement.replaceChild(block, p);
      } else {
        const figure = createTag('figure', { class: 'figure' }, picCandidate);
        const block = createTag('div', { class: 'figure' }, figure);
        p.parentElement.replaceChild(block, p);
      }
      loadStyle(`${miloLibs}/blocks/figure/figure.css`);
    }
  });
}


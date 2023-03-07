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

export async function buildAutoBlocks() {
  const miloLibs = getLibs();
  const { getMetadata, loadStyle, getConfig } = await import(`${miloLibs}/utils/utils.js`);
  const mainEl = document.querySelector('main');
  try {
    if (getMetadata('content-type') && !mainEl.querySelector('.article-header')) {
      const { default: decorateHeaderAndTags } = await import('./article-helper.js');
      await decorateHeaderAndTags(getLibs);
      loadStyle(`${getConfig().codeRoot}/styles/article.css`);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

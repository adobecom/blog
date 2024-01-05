/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const { sampleRUM, isSelected } = window.hlx.rum;

function extractBackgroundImage(element) {
  const matches = /^url\("?(.+)"?\)/.exec(element.style.backgroundImage);
  return matches ? matches[1] : undefined;
}

const backgroundImageObserver = (window.IntersectionObserver)
  ? new IntersectionObserver((entries, observer) => {
    entries
      .filter((entry) => entry.isIntersecting)
      .forEach((entry) => {
        observer.unobserve(entry.target); // observe only once
        const target = extractBackgroundImage(entry.target);
        const source = sampleRUM.sourceselector(entry.target);
        if (target) {
          sampleRUM('viewmedia', { target, source });
        }
      });
  }, { threshold: 0.25 }) : { observe: () => { } };

// eslint-disable-next-line import/prefer-default-export
export function observeBackgroundImages(elements) {
  if (isSelected) {
    elements.forEach((element) => {
      backgroundImageObserver.observe(element);
    });
  }
}

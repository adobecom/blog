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
const { sampleRUM } = window.hlx.rum;

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
  elements.forEach((element) => {
    backgroundImageObserver.observe(element);
  });
}

class ArticleFeedObserver {
  #feed;

  #observedElements = [];

  constructor(feed) {
    this.#feed = feed;
  }

  start() {
    if (this.#feed.classList.contains('appear')) {
      // the observer was started after the feed appeared, so observe the blocks and media now.
      this.#triggerRUMObserve();
      this.#startChildMutationObserver();
    } else {
      // otherwise, wait until the feed appears.
      new MutationObserver((mutations, observer) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class' && mutation.target.classList.contains('appear')) {
            observer.disconnect();
            this.#triggerRUMObserve();
            this.#startChildMutationObserver();
          }
        });
      }).observe(this.#feed, { attributes: true });
    }
  }

  #triggerRUMObserve() {
    const elementsToObserve = Array.from(this.#feed.querySelectorAll('.article-card, picture > img'))
      .filter((element) => !this.#observedElements.includes(element));
    this.#observedElements.push(...elementsToObserve);
    sampleRUM.observe(elementsToObserve);
  }

  // handle dynamically added article cards by re-triggering RUM observation
  // don't need to be super precise here, since we are tracking which elements
  // have already been observed in #observe()
  #startChildMutationObserver() {
    const articleCards = this.#feed.querySelector('.article-cards');
    if (articleCards) {
      new MutationObserver(() => {
        this.#triggerRUMObserve();
      }).observe(articleCards, { childList: true });
    }
  }
}

document.querySelectorAll('.article-feed').forEach((articleFeed) => {
  new ArticleFeedObserver(articleFeed).start();
});

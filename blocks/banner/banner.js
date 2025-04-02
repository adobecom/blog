import { createOptimizedPicture, normalizeHeadings, changeHTMLTag, hasDarkOrLightClass } from '../../scripts/utils.js';

export default async function init(block) {
  const bannerContents = document.createElement('div');
  bannerContents.classList.add('banner-contents');

  block.querySelectorAll('a').forEach(async (a) => {
    if (!a?.href) return;

    try {
      // get response from the URL
      const { pathname } = new URL(a);
      const path = pathname?.replace(/\.html$/, '');
      if (path) {
        const response = await fetch(`${path}.plain.html`);

        if (response.ok) {
          const responseEl = document.createElement('div');
          responseEl.innerHTML = await response.text();
          block.classList.add('is-loaded');

          // creating banner image and text div.
          const bannerImage = document.createElement('div');
          const bannerText = document.createElement('div');
          bannerImage.classList.add('banner-image');
          bannerText.classList.add('banner-text');

          if (!hasDarkOrLightClass(block)) {
            block.classList.add('dark'); // add default class
          }
        
          // banner image content
          const img = responseEl.querySelector('img');
          if (img) {
            const picture = img.closest('picture');
            const newPicture = createOptimizedPicture(img.src, img.alt);
            picture.parentElement.replaceChild(newPicture, picture);
            bannerImage.append(newPicture);
          } else {
            block.classList.add('bg-gradient-red');
          }

          // banner text content
          normalizeHeadings(responseEl, ['h3']);
          const heading = responseEl.querySelector('h3');
          if (heading) heading.classList.add('detail-m');
          const descriptions = responseEl.querySelectorAll('p');
          descriptions?.forEach((desc) => {
            if (!desc.querySelector('a') && desc.textContent.trim().length > 0) {
              desc.classList.add('heading-m', 'banner-description');
            }
          });

          const link = responseEl.querySelector('a');
          if (link) link.classList.add('con-button');

          bannerText.append(responseEl);

          // appending DOM objects
          bannerContents.append(bannerImage, bannerText);
          block.innerHTML = '';
          block.append(bannerContents);

          if (link?.href) {
            // switch whole banner to <a>
            const linkedBannerProperties = {
              class: block.classList,
              href: link.href,
              target: link.target,
            };
            const linkedBanner = changeHTMLTag(block, 'a', linkedBannerProperties);

            // switch inner link back to <span>
            const linkedBannerLink = linkedBanner.querySelector('a');
            changeHTMLTag(linkedBannerLink, 'span', { class: linkedBannerLink.classList });
          }
        } else {
          block.remove();
        }
      }
    } catch (e) {
      // do nothing
    }
  });
}

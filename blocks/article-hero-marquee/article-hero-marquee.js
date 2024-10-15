import { getLibs, buildBlock, hasDarkOrLightClass, getCircleGradientValue, hexToRgb, getImageCaption } from '../../scripts/utils.js';

function getBackgroundConfig(block) {
  const backgroundConfig = {
    backgroundEl: '<p> transparent </p>',
    addGradientClass: true,
    customGradients: false,
    customImage: false,
  };

  const customBackgroundImage = block.querySelector('img');
  const backgroundTextContent = block.textContent?.trim();
  const circleGradients = getCircleGradientValue(backgroundTextContent);

  if (customBackgroundImage) {
    backgroundConfig.customImage = customBackgroundImage;
    backgroundConfig.addGradientClass = false;
    return backgroundConfig;
  }

  if (circleGradients) {
    const gradient1 = hexToRgb(circleGradients[0]);
    const gradient2 = hexToRgb(circleGradients[1]);
    backgroundConfig.customGradients = [gradient1, gradient2];
    return backgroundConfig;
  }

  if (backgroundTextContent.length > 0) {
    backgroundConfig.backgroundEl = `<p> ${backgroundTextContent} </p>`;
    backgroundConfig.addGradientClass = false;
    return backgroundConfig;
  }

  return backgroundConfig;
}

async function loadAndExposeMarqueeBlock() {
  const miloLibs = getLibs();
  const [{ default: initMiloMarqueeBlock }, { loadStyle }] = await Promise.all([
    import(`${miloLibs}/blocks/marquee/marquee.js`),
    import(`${miloLibs}/utils/utils.js`)
  ]);
  loadStyle(`${miloLibs}/blocks/marquee/marquee.css`);
  window.initMarqueeBlock = initMiloMarqueeBlock;
}

function getFeaturedImage(block) {
  const pictures = Array.from(document.querySelectorAll('a[href*=".mp4"], picture'));
  const backgroundImage = block.querySelector('img');
  if (!backgroundImage) return pictures[0];

  const picture = Array.from(pictures).find(picture => !picture.closest('.article-hero-marquee'));

  return picture || null;
}

export default async function init(block) { 
  const miloLibs = getLibs();
  const [{ getMetadata }, { loadTaxonomy, getLinkForTopic, getTaxonomyModule }] = await Promise.all([
    import(`${miloLibs}/utils/utils.js`),
    import(`${miloLibs}/blocks/article-feed/article-helpers.js`),
    loadAndExposeMarqueeBlock()
  ]);

  // remove article hero marquee if it's not in sidebar layout, as it'll have duplicated content information with the original full-width article header
  const isSidebarLayout = getMetadata('page-template') === 'sidebar';
  if (!isSidebarLayout) {
    block.remove();
    return;
  }

  if (!getTaxonomyModule()) {
    await loadTaxonomy();
  }

  // get article category link, title, description + image
  const div = document.createElement('div');
  div.classList.add('section');
  const main = document.querySelector('main');

  const tag = getMetadata('article:tag');
  const category = tag || 'News';
  const categoryTag = getLinkForTopic(category);

  const h1 = document.querySelector('h1');
  const description = getMetadata('description');
  const picture = getFeaturedImage(block);
  const caption = getImageCaption(picture);
  const figure = document.createElement('div');
  figure.append(picture, caption);

  const tagEl = document.createElement('p');
  tagEl.textContent = category;

  // get background information
  const { backgroundEl, addGradientClass, customGradients, customImage } = getBackgroundConfig(block);

  const marqueeEl = buildBlock('marquee', [
    [ backgroundEl ],
    [
      {
        elems: [
          categoryTag,
          h1,
          `<p>${description}</p>`,
        ],
      },
      picture,
    ],
  ]);
  marqueeEl.classList.add('split', 'medium', 'article-hero-banner');
  window.initMarqueeBlock(marqueeEl);

  const categoryLink = marqueeEl.querySelector('a');
  categoryLink.classList.add('article-hero-category-link');

  if (addGradientClass) marqueeEl.classList.add('marquee-circle-gradient');
  if (customImage) {
    marqueeEl.style.setProperty('--bg-img', `url(${customImage.src})`);
  }

  if (customGradients?.length == 2) {
    marqueeEl.style.setProperty('--bg-circle-gradient-1', customGradients[0]);
    marqueeEl.style.setProperty('--bg-circle-gradient-2', customGradients[1]);
  }

  if (!hasDarkOrLightClass(block)) marqueeEl.classList.add('light');  

  // allow user to pass in classes from block to marquee
  if (block.classList.length > 1) {
    [...block.classList].forEach((className) => {
      if (className != 'article-hero-marquee') {
        marqueeEl.classList.add(className);
      }
    })
  }

  div.append(marqueeEl);
  main.prepend(div);

  // remove block as it's used as an medium to pass through required information only
  block.remove();  
}

import { getLibs, buildBlock, normalizeHeadings } from '../../scripts/utils.js';
import initBanner from '../banner/banner.js';

const defaultLimit = 9;
const ROOT_MARGIN = 50;
const blogIndex = {
  data: [],
  byPath: {},
  offset: 0,
  complete: false,
  config: {},
  offsetData: [],
};

// get data
async function fetchArticleFeedData() {
  const miloLibs = getLibs();
  const { getConfig } = await import(`${miloLibs}/utils/utils.js`);
  const { updateLinkWithLangRoot } = await import(`${miloLibs}/utils/helpers.js`);
  const { feed, limit } = blogIndex.config;

  const finalLimit = limit ? limit : defaultLimit;
  blogIndex.limit = finalLimit;
  const pageSize = Number(finalLimit) * 5;  // 5 times should be enough for filtering excluded items

  const queryParams = `?limit=${pageSize}&offset=${blogIndex.offset}`;
  const defaultPath = updateLinkWithLangRoot(`${getConfig().locale.contentRoot}/query-index.json`);

  const indexPath = feed
    ? `${feed}${queryParams}`
    : `${defaultPath}${queryParams}`;
  
  return fetch(indexPath)
    .then((response) => response.json())
    .then((json) => {
      const complete = (json.limit + json.offset) >= json.total;
      json.data.forEach((post) => {
        blogIndex.data.push(post);
        blogIndex.byPath[post.path.split('.')[0]] = post;
      });
      blogIndex.offsetData = json.data;
      blogIndex.complete = complete;

      return blogIndex;
    });
}

// filter data
const isInList = (list, val) => list && list.map((t) => t.toLowerCase()).includes(val);

async function filterArticleDataBasedOnConfig() {
  const miloLibs = getLibs();
  const { getArticleTaxonomy } = await import(`${miloLibs}/blocks/article-feed/article-helpers.js`);

  /* filter posts by category, tag and author */
  const FILTER_NAMES = ['tags', 'topics', 'selectedProducts', 'selectedIndustries', 'author', 'category', 'exclude'];

  const filters = Object.keys(blogIndex.config).reduce((prev, key) => {
    if (FILTER_NAMES.includes(key)) {
      prev[key] = blogIndex.config[key].split(',').map((e) => e.toLowerCase().trim());
    }
    return prev;
  }, {});

  const articleData = blogIndex.data;
  const KEYWORDS = ['exclude', 'tags', 'topics'];
  const SELECTED = ['selectedProducts', 'selectedIndustries'];

  const filteredArticleData = articleData.filter((article) => {
    const articleTaxonomy = getArticleTaxonomy(article);

    const matchedAll = Object.keys(filters).every((key) => {

      if (KEYWORDS.includes(key)) {
        const matchedFilter = filters[key]
          .some((val) => (isInList(articleTaxonomy?.allTopics, val)));
        return key === 'exclude' ? !matchedFilter : matchedFilter;
      }

      if (SELECTED.includes(key)) {
        if (filters.selectedProducts && filters.selectedIndustries) {
          // match product && industry
          const matchProduct = filters.selectedProducts
            .some((val) => (isInList(articleTaxonomy?.allTopics, val)));
          const matchIndustry = filters.selectedIndustries
            .some((val) => (isInList(articleTaxonomy?.allTopics, val)));
          return matchProduct && matchIndustry;
        }
        const matchedFilter = filters[key]
          .some((val) => isInList(articleTaxonomy.allTopics, val));
        return matchedFilter;
      }

      const matchedFilter = filters[key].some((val) => isInList([article[key]], val));
      return matchedFilter;
    });

    return (matchedAll);
  });

  blogIndex.data = filteredArticleData;
}

function buildMediaBlock() {
  let mediaHTML = `
    <div class="media small con-block"> 
      <div class="container foreground">
        <div class="media-row">
          <div data-valign="middle" class="image">
            ${pictureTag}
          </div>
          <div data-valign="middle" class="text">
            <p class="detail-m"><strong>${categoryText}</strong></p>
            <h2 class="heading-xs">
              <strong>${title}</strong>
            </h2>
            <p class="body-s">${description}</p>
            <div class="cta-container">
              <p class="body-s action-area">
                <a href="${path}" class="con-button outline">Read More</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `; 
}

async function buildBannerBlock(path) {
  const response = await fetch(`${path}.plain.html`);
  if (!response.ok) return false;

  const responseEl = document.createElement('div');
  responseEl.innerHTML = await response.text();

  // grab data
  const img = responseEl.querySelector('img');
  const pictureTag = createOptimizedPicture(img.src, img.alt);

  normalizeHeadings(responseEl, ['h3']);
  const heading = responseEl.querySelector('h3');

  let bannerHTML = `
    <div class="banner is-loaded">
      <div class="banner-contents">
        <div class="content-wrapper">
          <div class="banner-image">
          ${pictureTag.outerHTML}
          </div>

          <div class="banner-text dark">
            <div>
              <div>
                <p></p>
                <h3 class="detail-m">${heading.textContent}</h3>
                <p class="heading-l banner-description">${description}</p>
                <a href="https://www.adobe.com/products/photoshop-lightroom.html" class="con-button">Learn More</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return bannerHTML;
}

async function decorateArticleGrid(block) {
  const miloLibs = getLibs();
  const { createOptimizedPicture, getArticleTaxonomy, getLinkForTopic } = await import(`${miloLibs}/blocks/article-feed/article-helpers.js`);

  const articleData = blogIndex.data;
  const { banner } = blogIndex.config;

  const bannerPosConfig = blogIndex.config['banner-position'] ?  blogIndex.config['banner-position'] : false;
  const bannerPos = bannerPosConfig ? bannerPosConfig.split(',') : [];

  const section = block.closest('.section');
  block.classList.add('section', 'three-up', 'l-spacing');
  block.innerHTML = "";

  let articleIndex = 0;

  for (let i = 1; i <= defaultLimit; i++) { 
    let existingBannerIndex = bannerPos.indexOf(`${i}`);

    if (existingBannerIndex != -1) {
      const bannerBlock = buildBlock('banner', [
        [`<p> <a href="${banner[existingBannerIndex]}"></a> </p>`]
      ]);
      await initBanner(bannerBlock);
      block.append(bannerBlock);

    } else {

      const articleItem = articleData[articleIndex];
      const { author, title, date, description, image, imageAlt, path } = articleItem;
      const picture = createOptimizedPicture(image, imageAlt, [{ width: '750' }]);
      const pictureTag = picture.outerHTML;

      const articleTax = getArticleTaxonomy(articleItem);
      // const categoryTag = getLinkForTopic(articleTax.category, path);

      // TODO: test here
      const mediaBlock = buildBlock('media', [
        [pictureTag],
        [
          {
            elems: [
              `<p> categoryTag </p>`,
              `<h2> ${title} </h2>`,
              `<p> ${description} </p>`,
              `<a href="${path}"> Read More </a>`, // TODO: this may needs to be localized
            ]
          }
        ]
      ]);

      window.initMediaBlock(mediaBlock);
      block.append(mediaBlock);

      articleIndex++;
    }
  }

  section.replaceWith(block);

  // console.log("filterArticleDataBasedOnConfig:");
  // console.log(blogIndex.data);
}

async function loadAndExposeMediaBlock() {
  const miloLibs = getLibs();
  try {
      const module = await import(`${miloLibs}/blocks/media/media.js`);
      window.initMediaBlock = module.default;
      console.log('initMediaBlock function is now globally accessible.');
  } catch (error) {
      console.error('Error loading the module:', error);
  }
}



// move init into utils
// find ways to init later
export default async function init(block) { 
  const miloLibs = getLibs();
  const { loadStyle } = await import(`${miloLibs}/utils/utils.js`);
  const { readBlockConfig } = await import(`${miloLibs}/blocks/article-feed/article-feed.js`);

  await loadAndExposeMediaBlock();

  const styleLoaded = new Promise((resolve) => {
    loadStyle(`${miloLibs}/blocks/media/media.css`, resolve);
  })
  await styleLoaded;

  const initArticleGrid = async () => {


    blogIndex.config = readBlockConfig(block);

    await fetchArticleFeedData();             // fetch data
    await filterArticleDataBasedOnConfig();   // filtered data based on config

    // await decorateArticleGrid(block);
  }

  initArticleGrid();
}

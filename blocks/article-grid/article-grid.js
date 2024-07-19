import { getLibs, buildBlock, normalizeHeadings } from '../../scripts/utils.js';
import initBanner from '../banner/banner.js';

const defaultLimit = 9;
const blogIndex = {
  data: [],
  byPath: {},
  offset: 0,
  complete: false,
  config: {},
  offsetData: [],
};
const ROOT_MARGIN = 50;

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

async function decorateArticleGrid(block) {
  const miloLibs = getLibs();
  const { createOptimizedPicture, getArticleTaxonomy } = await import(`${miloLibs}/blocks/article-feed/article-helpers.js`);

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
      const { title, description, image, imageAlt, path } = articleItem;
      const picture = createOptimizedPicture(image, imageAlt, [{ width: '750' }]);
      const pictureTag = picture.outerHTML;

      const articleTax = getArticleTaxonomy(articleItem);

      const mediaBlock = buildBlock('media', [
        [
          pictureTag,
          {
            elems: [
              `<p> ${articleTax.category} </p>`,
              `<h2 class="title"> ${title} </h2>`,
              `<p class="body-s description"> ${description} </p>`,
              `<p class="action-area"><a href="${path}" class="con-button outline"> Read More </a></p>`, // TODO: may needs to be localized
            ]
          }
        ]
      ]);

      mediaBlock.classList.add('small');
      window.initMediaBlock(mediaBlock);
      block.append(mediaBlock);

      articleIndex++;
    }
  }

  section.replaceWith(block);
}

async function loadAndExposeMediaBlock() {
  const miloLibs = getLibs();
  try {
      const module = await import(`${miloLibs}/blocks/media/media.js`);
      window.initMediaBlock = module.default;
      // console.log('initMediaBlock function is now globally accessible.');
  } catch (error) {
      console.error('Error loading the module:', error);
  }
}

export default async function init(block) { 
  const miloLibs = getLibs();
  const { readBlockConfig } = await import(`${miloLibs}/blocks/article-feed/article-feed.js`);
  blogIndex.config = readBlockConfig(block);

  const initArticleGrid = async () => {
    await loadAndExposeMediaBlock();          // for reusing media block init

    await fetchArticleFeedData();             // fetch data
    await filterArticleDataBasedOnConfig();   // filtered data based on config

    await decorateArticleGrid(block);
    block.classList.add('ready');
  }

  async function handleIntersection(entries, observer) {
    for (const entry of entries) {
        if (entry.isIntersecting) {
            await initArticleGrid();
            observer.unobserve(entry.target);
        }
    }
  }

  // reduce inital load time
  const observer = new IntersectionObserver(handleIntersection, {
      root: null,          // Use the viewport as the root
      rootMargin: `${ROOT_MARGIN}px`,
  });
  observer.observe(block);
}

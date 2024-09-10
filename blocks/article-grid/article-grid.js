import { getLibs, buildBlock } from '../../scripts/utils.js';
import initBanner from '../banner/banner.js';

const miloLibs = getLibs();
const defaultLimit = 9;
const ROOT_MARGIN = 20;

// Used for getting localized text
const replacePlaceholder = async (key) => {
  const { replaceKey } = await import(`${miloLibs}/features/placeholders.js`);
  const { getConfig } = await import(`${miloLibs}/utils/utils.js`);
  const result = await replaceKey(key, getConfig());

  return result;
};

// get data
function getMetadataTags(doc) {
  const metaTagElements = doc.head.querySelectorAll('meta[property="article:tag"]');
  const tagContents = Array.from(metaTagElements, metaTag => metaTag.getAttribute('content')).filter(Boolean);
  
  return JSON.stringify(tagContents);
}

async function getArticleDetails(articleLink) {
  const { getMetadata } = await import(`${miloLibs}/utils/utils.js`);

  const path = new URL(articleLink).pathname;
  const resp = await fetch(path);
  if (!resp || !resp.ok) {
    // eslint-disable-next-line no-console
    console.log(`Could not retrieve metadata for ${path}`);
    return null;
  }
  const html = await resp.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const trimEndings = ['|Adobe', '| Adobe', '| Adobe Blog', '|Adobe Blog'];
  let title = getMetadata('og:title', doc).trim();
  const ending = trimEndings.find((el) => title.endsWith(el));
  [title] = title.split(ending);

  const image = doc.querySelector('img')

  // same data format for decorating media block
  return {
    title,
    description: getMetadata('description', doc),
    image: image.src,
    imageAlt: image.alt ? image.alt : title,
    tags: getMetadataTags(doc),
    path,
  };
}

async function fetchArticleFeedData(blogIndex) {
  const { getConfig } = await import(`${miloLibs}/utils/utils.js`);
  const { updateLinkWithLangRoot } = await import(`${miloLibs}/utils/helpers.js`);
  const { feed, articles, limit } = blogIndex.config;

  // fetch article data based on links
  if (articles) {
    const fetchArticleDataPromise = articles.map((article) => getArticleDetails(article));
    let articleData = [];

    articleData = await Promise.all(fetchArticleDataPromise);
    articleData.forEach((data) => {
      if (data) blogIndex.data.push(data);
    });
    blogIndex.complete = true;
    blogIndex.limit = defaultLimit;
    return;
  }

  // fetch feed data
  const finalLimit = limit || 500;
  blogIndex.limit = finalLimit;
  const queryParams = `?limit=${finalLimit}&offset=${blogIndex.offset}`;
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

async function filterArticleDataBasedOnConfig(blogIndex) {
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

async function decorateMediaBlock(articleItem) {
  const { createOptimizedPicture, getArticleTaxonomy } = await import(`${miloLibs}/blocks/article-feed/article-helpers.js`);

  const { title, description, image, imageAlt, path } = articleItem;
  const picture = createOptimizedPicture(image, imageAlt, [{ width: '750' }]);
  const pictureTag = picture.outerHTML;
  const articleTax = getArticleTaxonomy(articleItem);

  const readMore = await replacePlaceholder('read-more');

  const mediaBlock = buildBlock('media', [
    [
      pictureTag,
      {
        elems: [
          `<p> ${articleTax.category} </p>`,
          `<h2 class="title"> ${title} </h2>`,
          `<p class="body-s description"> ${description} </p>`,
          `<p class="action-area"><a href="${path}" class="con-button outline"> ${readMore} </a></p>`,
        ]
      }
    ]
  ]);

  mediaBlock.classList.add('small');
  window.initMediaBlock(mediaBlock);

  return mediaBlock;
}

async function decorateLoadMoreButton() {
  const loadMore = document.createElement('a');
  loadMore.className = 'load-more con-button outline';
  loadMore.href = '#';
  loadMore.textContent = await replacePlaceholder('load-more');

  return loadMore;
}

async function decorateArticleGrid(block, blogIndex) {
  const miloLibs = getLibs();
  const { createTag } = await import(`${miloLibs}/utils/utils.js`);

  const articleData = blogIndex.data;
  // const { offset, dataOffset } = blogIndex;
  const { offset } = blogIndex;
  const { banner } = blogIndex.config;

  const bannerPosConfig = blogIndex.config['banner-position'] ? blogIndex.config['banner-position'] : false;
  const bannerData = typeof banner === 'string' ? [banner] : banner;

  // [5, 9]
  const bannerPos = bannerPosConfig ? bannerPosConfig.split(',').map(pos => pos.trim()) : [];

  let resultContainer = block.querySelector('.article-grid-result');
  if (!resultContainer) {
    resultContainer = document.createElement('div');
    resultContainer.classList.add('article-grid-result','section', 'three-up', 'l-spacing');
  }

  if (offset == 0) {
    block.innerHTML = "";
    let loadingContainer = decorateLoadingContainer();
    block.prepend(loadingContainer);
    block.append(resultContainer);
    block.classList.add('loading');
  }

  let articleIndex = offset;
  let limit = offset + defaultLimit; // 9
  let displayLimit = limit > articleData.length ? (articleData.length + bannerPos.length) : limit;
  
  for (let i = offset; i < displayLimit; i++) { 
    let existingBannerIndex = bannerPos.indexOf(`${i + 1}`);

    if (existingBannerIndex != -1 && bannerData && bannerData[existingBannerIndex].length > 0) {

      const bannerBlock = buildBlock('banner', [
        [`<p> <a href="${bannerData[existingBannerIndex]}"></a> </p>`]
      ]);
      await initBanner(bannerBlock);
      bannerBlock.classList.add('article-grid-item')
      resultContainer.append(bannerBlock);

      // remove banner link after already loaded on page
      bannerData[existingBannerIndex] = '';

    } else {

      const articleItem = articleData[articleIndex];
      let mediaBlock = await decorateMediaBlock(articleItem);

      let linkEl = mediaBlock.querySelector('a');
      if (linkEl.href && linkEl.href.length > 0) { 
        // let linkedMediaBlock = 
        const mediaBlockContent = mediaBlock.innerHTML;
        let linkedMediaBlock = createTag('a',
          {
            class: mediaBlock.classList,
            href: linkEl.href,
            target: linkEl.target
          },
          mediaBlockContent
        );

        mediaBlock = linkedMediaBlock
      }

      mediaBlock.classList.add('article-grid-item');

      resultContainer.append(mediaBlock);

      articleIndex++;
    }
  }

  blogIndex.offset = articleIndex;
  
  if (articleData.length > blogIndex.offset) {
    let loadMoreButton = await decorateLoadMoreButton();
    // used p to allow selecting last odd item in tablet mode easier
    const loadMoreContainer = document.createElement('p');
    loadMoreContainer.classList.add('load-more-container');
    loadMoreContainer.append(loadMoreButton);
    resultContainer.append(loadMoreContainer);

    loadMoreButton.addEventListener('click', async (e) => {
      e.preventDefault();
      loadMoreContainer.remove();
      await decorateArticleGrid(block, blogIndex);
    });
  }

}

async function loadAndExposeMediaBlock() {
  try {
      const module = await import(`${miloLibs}/blocks/media/media.js`);
      window.initMediaBlock = module.default;
      // console.log('initMediaBlock function is now globally accessible.');
  } catch (error) {
      console.error('Error loading the module:', error);
  }
}

function decorateLoadingContainer() {
  const container = document.createElement('div');
  container.classList.add('loading-container');
  const spinner = document.createElement('div');
  spinner.classList.add('spinner');

  container.append(spinner);
  return container;
}

// need to allow custom article + load more latest articles
// column key: articles -> fetch data based on article links
// column key: feed -> fetch data based on feed single link (has load more button)
export default async function init(block) { 
  const { readBlockConfig } = await import(`${miloLibs}/blocks/article-feed/article-feed.js`);

  const blogIndex = {
    data: [],
    byPath: {},
    offset: 0,       // number of total items (article + banner)
    // dataOffset: 0,   // number of article data used
    complete: false,
    config: {},
    offsetData: [],
  };
  blogIndex.config = readBlockConfig(block);

  const initArticleGrid = async () => {
    await loadAndExposeMediaBlock();          // for reusing media block init

    await fetchArticleFeedData(blogIndex);             // fetch data
    await filterArticleDataBasedOnConfig(blogIndex);   // filtered data based on config

    await decorateArticleGrid(block, blogIndex);
    
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

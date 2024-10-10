import { getLibs, buildBlock, replacePlaceholderForLocalizedText } from '../../scripts/utils.js';
import initBanner from '../banner/banner.js';

const miloLibs = getLibs();
const DEFAULT_GRID_LIMIT = 9;
const DEFAULT_FEED_DATA_LIMIT = 500;
const ROOT_MARGIN = 20;

// get data
function getMetadataTags(doc) {
  const metaTagElements = doc.head.querySelectorAll('meta[property="article:tag"]');
  const tagContents = [...metaTagElements].map(metaTag =>
    metaTag.getAttribute('content')).filter(Boolean);

  return JSON.stringify(tagContents);
}

async function getArticleDetails(articleLink) {
  const { getMetadata } = await import(`${miloLibs}/utils/utils.js`);

  const path = new URL(articleLink).pathname;
  const resp = await fetch(path);
  if (!resp?.ok) {
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

  const image = doc.querySelector('img');

  // same data format for decorating media block
  return {
    title,
    description: getMetadata('description', doc),
    image: image.src,
    imageAlt: image.alt || title,
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
    const articleData = await Promise.all(fetchArticleDataPromise);

    articleData.forEach((data) => {
      if (data) blogIndex.data.push(data);
    });
    blogIndex.complete = true;
    blogIndex.limit = DEFAULT_GRID_LIMIT;
    return false;
  }

  // fetch feed data
  const finalLimit = limit || DEFAULT_FEED_DATA_LIMIT;
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
const isInList = (list, val) => list?.map((t) => t.toLowerCase()).includes(val);

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

function decorateLoadingContainer() {
  const container = document.createElement('div');
  container.classList.add('loading-container');
  const spinner = document.createElement('div');
  spinner.classList.add('spinner');

  container.append(spinner);
  return container;
}

async function decorateMediaBlock(articleItem) {
  const { createOptimizedPicture, getArticleTaxonomy } = await import(`${miloLibs}/blocks/article-feed/article-helpers.js`);

  const { title, description = '', image, imageAlt = title || '', path } = articleItem;
  const picture = createOptimizedPicture(image, imageAlt, [{ width: '750' }]);
  const pictureTag = picture.outerHTML;
  const articleTax = getArticleTaxonomy(articleItem);

  const readMore = await replacePlaceholderForLocalizedText('read-more');

  const mediaBlock = buildBlock('media', [
    [
      pictureTag,
      {
        elems: [
          `<p> ${articleTax.category} </p>`,
          `<h2 class="title"> ${title} </h2>`,
          `<p class="body-s description"> ${description} </p>`,
          `<p class="action-area"><a href="${path}" class="con-button outline"> ${readMore} </a></p>`,
        ],
      },
    ],
  ]);

  mediaBlock.classList.add('small');
  window.initMediaBlock(mediaBlock);

  return mediaBlock;
}

function getOrCreateResultContainer(block) {
  let resultContainer = block.querySelector('.article-grid-result');
  if (!resultContainer) {
    resultContainer = document.createElement('div');
    resultContainer.classList.add('article-grid-result');
  }
  return resultContainer;
}

function initLoadingState(block, resultContainer) {
  block.innerHTML = '';
  const loadingContainer = decorateLoadingContainer();
  block.prepend(loadingContainer);
  block.append(resultContainer);
  block.classList.add('loading');
}

function calculateDisplayLimit(offset, totalArticles, totalBanners) {
  const limit = offset + DEFAULT_GRID_LIMIT;
  return limit > totalArticles ? (totalArticles + totalBanners) : limit;
}

function getBannerStyle(url) {
  const urlFragment = url?.split('#')[1];
  if (!urlFragment) return false;

  const result = [];
  const params = urlFragment.split('&');

  params.forEach((param) => {
    const [key, ...valueParts] = param.split('-');
    if (key === 'style') result.push(valueParts.join('-'));
  });
  return result;
}

async function loadBannerIfAvailable(bannerPos, bannerData, index, resultContainer) {
  const existingBannerIndex = bannerPos.indexOf(`${index + 1}`);

  if (existingBannerIndex !== -1 && bannerData[existingBannerIndex]) {
    const bannerBlock = buildBlock('banner', [
      [`<p> <a href="${bannerData[existingBannerIndex]}"></a> </p>`],
    ]);

    const bannerClasses = getBannerStyle(bannerData[existingBannerIndex]);
    if (bannerClasses?.length > 0) {
      bannerClasses.forEach((className) => {
        bannerBlock.classList.add(className);
      });
    }

    await initBanner(bannerBlock);
    bannerBlock.classList.add('article-grid-item');
    resultContainer.append(bannerBlock);
    bannerData[existingBannerIndex] = '';
    return true;
  }

  return false;
}

async function loadArticleItem(articleItem, resultContainer, createTag) {
  let mediaBlock = await decorateMediaBlock(articleItem);

  const linkEl = mediaBlock.querySelector('a');
  if (linkEl.href) {
    const mediaBlockContent = mediaBlock.innerHTML;
    mediaBlock = createTag(
      'a',
      {
        class: mediaBlock.classList,
        href: linkEl.href,
        target: linkEl.target,
      },
      mediaBlockContent,
    );
  }

  mediaBlock.classList.add('article-grid-item');
  resultContainer.append(mediaBlock);
}

async function loadAndExposeMediaBlock() {
  try {
    const module = await import(`${miloLibs}/blocks/media/media.js`);
    window.initMediaBlock = module.default;

    const { loadStyle } = await import(`${miloLibs}/utils/utils.js`);
    loadStyle(`${miloLibs}/blocks/media/media.css`);
  } catch (error) {
    console.error('Error loading the module:', error);
  }
}

function getBannerPosition(bannerData) {
  const bannerPos = [];
  if (!bannerData?.length) return bannerPos;
  
  bannerData.forEach((banner) => {
    if (!banner?.length) return;

    const url = new URL(banner);
    const position = url.hash?.match(/position-(\d+)/)?.[1];

    if (position) bannerPos.push(position);
  });

  return bannerPos;
}

async function decorateArticleGrid(block, blogIndex) {
  const { createTag } = await import(`${miloLibs}/utils/utils.js`);
  const articleData = blogIndex.data;
  const { offset, config } = blogIndex;
  const { banner } = config;

  const bannerData = banner ? (Array.isArray(banner) ? banner : [banner]) : [];
  const bannerPos = getBannerPosition(bannerData);
  const resultContainer = getOrCreateResultContainer(block);

  if (offset === 0) {
    initLoadingState(block, resultContainer);
  }

  let articleIndex = offset;
  const displayLimit = calculateDisplayLimit(offset, articleData.length, bannerPos.length);

  // Load articles and banners
  for (let i = offset; i < displayLimit; i += 1) {
    const bannerLoaded = await loadBannerIfAvailable(bannerPos, bannerData, i, resultContainer);

    if (!bannerLoaded) {
      await loadArticleItem(articleData[articleIndex], resultContainer, createTag);
      articleIndex += 1;
    }
  }

  blogIndex.offset = articleIndex;

  // If more articles are available, show load more button
  if (articleData.length > blogIndex.offset) {
    await setupLoadMoreButton(block, blogIndex, resultContainer);
  }
}

async function decorateLoadMoreButton() {
  const loadMore = document.createElement('a');
  loadMore.className = 'load-more con-button outline';
  loadMore.href = '#';
  loadMore.textContent = await replacePlaceholderForLocalizedText('load-more');

  return loadMore;
}

async function setupLoadMoreButton(block, blogIndex, resultContainer) {
  const loadMoreButton = await decorateLoadMoreButton();
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

function hideOddButtonOnTabletIfIsFeedData(block, blogIndex) {
  const { feed } = blogIndex.config;
  if (feed) block.classList.add('hide-odd-item-on-tablet');
}

// block for loading article + banner
// column key: articles -> fetch data based on article links
// column key: feed -> fetch data based on feed single link (has load more button)
export default async function init(block) {
  const { readBlockConfig } = await import(`${miloLibs}/blocks/article-feed/article-feed.js`);

  const blogIndex = {
    data: [],
    byPath: {},
    offset: 0, // number of total items (article + banner)
    complete: false,
    config: {},
    offsetData: [],
  };
  blogIndex.config = readBlockConfig(block);

  const initArticleGrid = async () => {
    await loadAndExposeMediaBlock(); // for reusing media block init

    await fetchArticleFeedData(blogIndex);
    await filterArticleDataBasedOnConfig(blogIndex);

    await decorateArticleGrid(block, blogIndex);
    hideOddButtonOnTabletIfIsFeedData(block, blogIndex);

    block.classList.add('ready');
  };

  async function handleIntersection(entries, observer) {
    entries.forEach(async (entry) => {
      if (entry.isIntersecting) {
        await initArticleGrid();
        observer.unobserve(entry.target);
      }
    });
  }

  // reduce inital load time
  const observer = new IntersectionObserver(handleIntersection, {
    root: null, // Use the viewport as the root
    rootMargin: `${ROOT_MARGIN}px`,
  });
  observer.observe(block);
}

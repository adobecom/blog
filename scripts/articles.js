import { getLibs } from '../../scripts/utils.js';
import { initCopyLinkButtonFunction } from '../blocks/article-meta/article-meta.js';

function cloneBlockToSidebar(sidebar, blockClass) {
  const targetBlock = document.querySelector(`.${blockClass}`);
  if (!targetBlock) return false;

  const clonedBlock = targetBlock.cloneNode(true);
  targetBlock.classList.add('hide-if-sidebar-visible');

  sidebar.append(clonedBlock);

  return clonedBlock;
}

async function initSidebar() {
  const sidebar = document.createElement('div');
  sidebar.classList.add('blog-wrapper-sidebar');

  const sidebarArticleMeta = cloneBlockToSidebar(sidebar, 'article-meta');
  initCopyLinkButtonFunction(sidebarArticleMeta);
  cloneBlockToSidebar(sidebar, 'banner');
  cloneBlockToSidebar(sidebar, 'tags');

  return sidebar;
}

function moveRecommendedArticleAsFinalSection(main) {
  const recBlock = main.querySelector('.recommended-articles');
  if (!recBlock) return;

  const section = document.createElement('div');
  section.classList.add('section');
  section.append(recBlock);
  main.append(section);
}

async function setUpSidebarLayoutForArticlePage() {
  const miloLibs = getLibs();
  const { getMetadata } = await import(`${miloLibs}/utils/utils.js`);

  const main = document.querySelector('main');
  const childContent = document.querySelector('.content');
  const isArticlePage = getMetadata('content-type') === 'article';

  if (!isArticlePage || !childContent) return;

  const sections = document.querySelectorAll('.section');
  if (!sections) return;

  // select first section to hold all the content
  const mainContent = childContent.closest('.section');
  mainContent.classList.add('blog-wrapper-content');

  sections.forEach((section, index) => {
    const isArticleBanner = section.querySelector('.marquee') && index === 0;
    const isMainContent = mainContent === section;
    if (!isArticleBanner && !isMainContent) {
      mainContent.appendChild(section);
    }
  });

  // Put blog wrapper (wraps sidebar + content) first
  const blogWrapper = document.createElement('div');
  blogWrapper.classList.add('blog-wrapper');
  main.insertBefore(blogWrapper, mainContent);

  // Put sidebar + content into blog wrapper
  const sidebar = await initSidebar();
  blogWrapper.append(sidebar, mainContent);

  // Move recommended-articles as last separate section if any
  moveRecommendedArticleAsFinalSection(main);
}

async function buildProgressBar() {
  const miloLibs = getLibs();
  const { getMetadata } = await import(`${miloLibs}/utils/utils.js`);

  if (!getMetadata('content-type') === 'article' || document.querySelector('.article-header')) return;

  const { createTag } = await import(`${miloLibs}/utils/utils.js`);
  const progressBarContainer = createTag('div', { class: 'progress-bar-container' });
  const progressBar = createTag('div', { class: 'progress-bar' });
  progressBarContainer.appendChild(progressBar);

  const body = document.querySelector('body');
  body.append(progressBarContainer);

  function updateProgressBar() {
    const content = document.querySelector('main');
    const contentHeight = content.scrollHeight - window.innerHeight;
    const scrollPosition = window.scrollY;
    const initialWidth = 5;

    let progress = initialWidth;

    if (scrollPosition < contentHeight) {
      progress += (scrollPosition / contentHeight) * (100 - initialWidth);
    } else {
      progress = 100;
    }

    progressBar.style.width = `${progress}%`;
  }

  window.onscroll = function () {
    updateProgressBar();
  };
}

export async function decorateArticlePageUI() {
  await setUpSidebarLayoutForArticlePage();
  await buildProgressBar();
}

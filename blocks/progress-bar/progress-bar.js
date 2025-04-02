import { getLibs } from '../../scripts/utils.js';

const INITIAL_WIDTH = 5;

function updateProgressBar(progressBar) {
  const content = document.querySelector('main');
  const contentHeight = content.scrollHeight - window.innerHeight;
  const scrollPosition = window.scrollY;
  
  let progress = INITIAL_WIDTH;

  if (scrollPosition < contentHeight) {
    progress += (scrollPosition / contentHeight) * (100 - INITIAL_WIDTH);
  } else {
    progress = 100;
  }

  progressBar.style.width = `${progress}%`;
}

export default async function init() {
  const miloLibs = getLibs();
  const { createTag } = await import(`${miloLibs}/utils/utils.js`);

  const progressBarContainer = createTag('div', { class: 'progress-bar-container' });
  const progressBar = createTag('div', { class: 'progress-bar' });
  progressBarContainer.appendChild(progressBar);

  const body = document.querySelector('body');
  body.append(progressBarContainer);

  window.onscroll = () => {
    updateProgressBar(progressBar);
  };

  return progressBarContainer;
}

import { getLibs } from '../../scripts/utils.js';

/**
 * Creates an SVG tag using the specified ID.
 * @param {string} id The ID
 * @returns {Element} The SVG tag
 */
function createSVG(id) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `/img/icons/icons.svg#${id}`);
  svg.appendChild(use);
  return svg;
}

/**
 * The carousel's navigation
 * @param {Element} block The container of the carousel
 */
function carouselAndLightbox(block) {
  const wrapper = block.querySelector('.blog-carousel-wrapper');
  const lightbox = block.querySelector('.blog-carousel-lightbox');
  const expandButtons = wrapper.querySelectorAll('.blog-carousel-expand');
  const carouselSlides = wrapper.querySelectorAll('.blog-carousel-slide');
  const lightboxSlides = lightbox.querySelectorAll('.blog-carousel-slide');
  const dots = wrapper.querySelectorAll('.blog-carousel-dot');
  const carouselPrevious = wrapper.querySelector('.blog-carousel-previous');
  const carouselNext = wrapper.querySelector('.blog-carousel-next');
  const lightboxPrevious = lightbox.querySelector('.blog-carousel-previous');
  const lightboxNext = lightbox.querySelector('.blog-carousel-next');
  const lightboxThumbnails = lightbox.querySelectorAll('.blog-carousel-dot');
  const closeLightboxBtn = lightbox.querySelector('.blog-carousel-close-lightbox');
  const updateCarousel = (slides, navDots, index) => {
    const current = slides[index];
    const prev = slides[index - 1] ?? slides[[...slides].length - 1];
    const next = slides[index + 1] ?? slides[0];
    slides.forEach((slide) => {
      slide.classList.remove('slide-active');
      slide.classList.remove('slide-prev');
      slide.classList.remove('slide-next');
    });
    current.classList.add('slide-active');
    prev.classList.add('slide-prev');
    next.classList.add('slide-next');
    navDots.forEach((otherDot) => { otherDot.classList.remove('dot-active'); });
    navDots[index].classList.add('dot-active');
  };
  let carouselIndex = 0;
  updateCarousel(carouselSlides, dots, carouselIndex);
  const incrementCurrentCarousel = (next = true) => {
    let slides = carouselSlides;
    let navDots = dots;
    if (wrapper.closest('.blog-carousel').classList.contains('lightbox')) {
      slides = lightboxSlides;
      navDots = lightboxThumbnails;
    }
    if (next) {
      carouselIndex += 1;
      if (carouselIndex > [...slides].length - 1) carouselIndex = 0;
    } else {
      carouselIndex -= 1;
      if (carouselIndex < 0) carouselIndex = [...slides].length - 1;
    }
    updateCarousel(slides, navDots, carouselIndex);
  };
  carouselNext.addEventListener('click', () => { incrementCurrentCarousel(true); });
  carouselPrevious.addEventListener('click', () => { incrementCurrentCarousel(false); });
  lightboxNext.addEventListener('click', () => { incrementCurrentCarousel(true); });
  lightboxPrevious.addEventListener('click', () => { incrementCurrentCarousel(false); });
  [...dots].forEach((dot, index) => {
    dot.addEventListener('click', () => {
      if (index !== carouselIndex) {
        carouselIndex = index;
        updateCarousel(carouselSlides, dots, carouselIndex);
      }
    });
  });
  [...lightboxThumbnails].forEach((thumbnail, index) => {
    thumbnail.addEventListener('click', () => {
      if (index !== carouselIndex) {
        carouselIndex = index;
        updateCarousel(lightboxSlides, lightboxThumbnails, carouselIndex);
      }
    });
  });
  [...expandButtons].forEach((btn) => {
    btn.addEventListener('click', () => {
      updateCarousel(lightboxSlides, lightboxThumbnails, carouselIndex);
      wrapper.closest('.blog-carousel').classList.add('lightbox');
      lightboxThumbnails[carouselIndex].focus({ preventScroll: true });
    });
  });
  const closeLightbox = () => {
    wrapper.classList.add('no-animation');
    updateCarousel(carouselSlides, dots, carouselIndex);
    wrapper.closest('.blog-carousel').classList.remove('lightbox');
    setTimeout(() => { wrapper.classList.remove('no-animation'); }, 300);
  };
  closeLightboxBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    // Close lightbox when click on background=
    if ((e.target.tagName.toLowerCase() !== 'img'
      && e.target.tagName.toLowerCase() !== 'button'
      && e.target.tagName.toLowerCase() !== 'svg'
      && e.target.tagName.toLowerCase() !== 'use'
      && e.target.tagName.toLowerCase() !== 'path'
      && e.target.tagName.toLowerCase() !== 'p'
      && e.target.tagName.toLowerCase() !== 'a'
      && !e.target.classList.contains('blog-carousel-controls'))) {
      closeLightbox();
    }
  });
  block.addEventListener('keydown', (e) => {
    const navDots = (wrapper.closest('.blog-carousel').classList.contains('lightbox')) ? lightboxThumbnails : dots;
    if (e.key === 'ArrowLeft') {
      incrementCurrentCarousel(false);
      navDots[carouselIndex].focus({ preventScroll: true });
    } else if (e.key === 'ArrowRight') {
      incrementCurrentCarousel(true);
      navDots[carouselIndex].focus({ preventScroll: true });
    } else if (e.key === 'Escape' && wrapper.closest('.blog-carousel').classList.contains('lightbox')) {
      closeLightbox();
      navDots[carouselIndex].focus({ preventScroll: true });
    }
  });
}

/**
 * Builds the carousel html
 * @param {Array} imgSlides Array of objects, ex: [{img: imgElement, caption: pElement}, {...}]
 * @param {Element} block The container of the carousel
 * @param {string} aspectRatio height ÷ width percentage of the carousel, ex: 50%;
 */
async function buildCarousel(imgSlides, block, aspectRatio = '50%') {
  const { createTag } = await import(`${getLibs()}/utils/utils.js`);
  block.innerHTML = '';
  const wrapper = createTag('div', { class: 'blog-carousel-wrapper' });
  const controls = createTag('div', { class: 'blog-carousel-controls' });
  const slides = createTag('div', { class: 'blog-carousel-slides' });
  const dots = createTag('div', { class: 'blog-carousel-dots' });
  const slidesWrapper = createTag('div', { tabIndex: '0' });
  wrapper.appendChild(controls);
  wrapper.appendChild(slides);
  wrapper.appendChild(dots);
  slides.appendChild(slidesWrapper);
  block.appendChild(wrapper);
  const prev = createTag('button', { class: 'blog-carousel-arrow blog-carousel-previous', 'aria-label': 'Previous slide' });
  const next = createTag('button', { class: 'blog-carousel-arrow blog-carousel-next', 'aria-label': 'Next slide' });
  prev.appendChild(createSVG('chevron'));
  next.appendChild(createSVG('chevron'));
  controls.appendChild(prev);
  controls.appendChild(next);
  imgSlides.forEach((imgSlide, index) => {
    const slide = createTag('div', { class: 'blog-carousel-slide' });
    slide.appendChild(imgSlide.img);
    const expandButton = createTag('button', { class: 'blog-carousel-expand', 'aria-label': 'Open in full screen' });
    expandButton.appendChild(createSVG('expand'));
    slide.appendChild(expandButton);
    slidesWrapper.appendChild(slide);
    const dot = createTag('button', { class: 'blog-carousel-dot', 'aria-label': `Slide ${index + 1}` });
    dots.appendChild(dot);
    if (imgSlide.caption !== null) slide.appendChild(imgSlide.caption);
  });
  const lightbox = wrapper.cloneNode(true);
  lightbox.classList.add('blog-carousel-lightbox');
  const closeButton = createTag('button', { class: 'blog-carousel-close-lightbox', 'aria-label': 'Close full screen' });
  closeButton.appendChild(createSVG('close'));
  lightbox.appendChild(closeButton);
  block.appendChild(lightbox);
  const lightboxThumbnails = lightbox.querySelectorAll('.blog-carousel-dot');
  [...lightboxThumbnails].forEach((thumbnail, index) => {
    thumbnail.appendChild(imgSlides[index].img.cloneNode(true));
  });
  if (aspectRatio) slidesWrapper.style.paddingBottom = aspectRatio;
  carouselAndLightbox(block);
}

export default async function decorate(block) {
  const imgs = block.querySelectorAll('picture');
  const imgSlides = [];
  let aspectRatio;
  [...imgs].forEach((picture) => {
    // unwrap picture if wrapped in p tag
    if (picture.parentElement.tagName === 'P') {
      const parentDiv = picture.closest('div');
      const parentParagraph = picture.parentNode;
      parentDiv.insertBefore(picture, parentParagraph);
    }
    // Find the caption if there is one
    let caption = null;
    let nextElement = picture.nextElementSibling;
    if (nextElement && nextElement.tagName.toLowerCase() !== 'picture') {
      while (nextElement && nextElement.tagName.toLowerCase() !== 'picture' && (nextElement.childElementCount === 0 || nextElement.textContent === '')) {
        nextElement = nextElement.nextElementSibling;
      }
      if (nextElement && nextElement.childElementCount !== 0 && nextElement.textContent !== '') caption = nextElement;
    }
    imgSlides.push({ img: picture, caption });
    // Find the aspect ratio of the shortest image
    const img = picture.querySelector('img');
    const ratio = img.offsetHeight / img.offsetWidth;
    if (aspectRatio === undefined || ratio < aspectRatio) aspectRatio = ratio;
  });
  // Build the carousel:
  block.innerHTML = '';
  await buildCarousel(imgSlides, block, `${(aspectRatio * 100)}%`);
}

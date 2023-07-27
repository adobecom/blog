/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import { readFile, sendKeys } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../scripts/utils.js';

const { default: init } = await import('../../../blocks/blog-carousel/blog-carousel.js');
document.body.innerHTML = await readFile({ path: './mocks/body.html' });
const ogDoc = document.body.innerHTML;

describe('Blog Carousel', () => {
  let carousel;

  before(async () => {
    setLibs('https://milo.adobe.com/libs');
  });

  beforeEach(async () => {
    carousel = document.body.querySelector('.blog-carousel');
    await init(carousel);
  });

  afterEach(() => {
    document.body.innerHTML = ogDoc;
  });

  it('Carousel exists', async () => {
    expect(carousel).to.exist;
  });

  it('Carousel has slides', () => {
    const slides = carousel.querySelectorAll('.blog-carousel-slide');
    const activeSlide = slides[0].classList.contains('slide-active');
    expect(slides).to.exist;
    expect(activeSlide).to.be.true;
  });

  it('Carousel has navigation buttons', () => {
    const nextButton = carousel.querySelector('.blog-carousel-next');
    const previousButton = carousel.querySelector('.blog-carousel-previous');
    const slideIndicators = carousel.querySelectorAll('.blog-carousel-dot');
    const activeIndicator = slideIndicators[0].classList.contains('dot-active');
    expect(nextButton).to.exist;
    expect(previousButton).to.exist;
    expect(slideIndicators).to.exist;
    expect(activeIndicator).to.be.true;
  });

  it('Clicks on next and previous slide buttons', () => {
    const nextButton = carousel.querySelector('.blog-carousel-next');
    const previousButton = carousel.querySelector('.blog-carousel-previous');
    const slides = carousel.querySelectorAll('.blog-carousel-slide');
    const slideIndicators = carousel.querySelectorAll('.blog-carousel-dot');

    nextButton.click();
    let activeSlide = slides[1].classList.contains('slide-active');
    let activeIndicator = slideIndicators[1].classList.contains('dot-active');
    expect(activeSlide).to.be.true;
    expect(activeIndicator).to.be.true;

    previousButton.click();
    activeSlide = slides[0].classList.contains('slide-active');
    activeIndicator = slideIndicators[0].classList.contains('dot-active');
    expect(activeSlide).to.be.true;
    expect(activeIndicator).to.be.true;
  });

  it('Keyboard navigation to go to next and previous slide', async () => {
    const nextButton = carousel.querySelector('.blog-carousel-next');
    const previousButton = carousel.querySelector('.blog-carousel-previous');
    const slides = carousel.querySelectorAll('.blog-carousel-slide');
    const slideIndicators = carousel.querySelectorAll('.blog-carousel-dot');

    nextButton.focus();
    await sendKeys({ press: 'ArrowRight' });
    let activeSlide = slides[1].classList.contains('slide-active');
    let activeIndicator = slideIndicators[1].classList.contains('dot-active');
    expect(activeSlide).to.be.true;
    expect(activeIndicator).to.be.true;

    previousButton.focus();
    await sendKeys({ press: 'ArrowLeft' });
    activeSlide = slides[0].classList.contains('slide-active');
    activeIndicator = slideIndicators[0].classList.contains('dot-active');
    expect(activeSlide).to.be.true;
    expect(activeIndicator).to.be.true;
  });

  it('Carousel lightbox is enabled, lightbox open and close buttons clicked', async () => {
    const lightboxButton = carousel.querySelector('.blog-carousel-expand');
    expect(lightboxButton).to.exist;

    // Click carousel-expand icon and open lightbox
    lightboxButton.click();
    let lightboxActive = carousel.classList.contains('lightbox');
    expect(lightboxActive).to.be.true;

    // Click carousel-close icon and close lightbox
    const lightboxCloseButton = carousel.querySelector('.blog-carousel-close-lightbox');
    lightboxCloseButton.click();
    lightboxActive = carousel.classList.contains('lightbox');
    expect(lightboxActive).to.be.false;
  });

  it('Close lightbox by clicking on lightbox', async () => {
    const lightboxButton = carousel.querySelector('.blog-carousel-expand');
    expect(lightboxButton).to.exist;

    // Activate/open lightbox
    lightboxButton.click();
    let lightboxActive = carousel.classList.contains('lightbox');
    expect(lightboxActive).to.be.true;

    // Close lightbox by clicking on lightbox
    const lightbox = carousel.querySelector('.blog-carousel-lightbox');
    lightbox.click();
    lightboxActive = carousel.classList.contains('lightbox');
    expect(lightboxActive).to.be.false;
  });

  it('Clicks on a carousel dot', () => {
    const unselectedIndicator = carousel.querySelector('.blog-carousel-dot:not(.dot-active)');
    const indicators = carousel.querySelectorAll('.blog-carousel-wrapper:not(.blog-carousel-lightbox) .blog-carousel-dot');
    const firstIndicator = indicators[0];
    const lastIndicator = indicators[indicators.length - 1];

    unselectedIndicator.click();
    expect(unselectedIndicator.classList.contains('dot-active')).to.be.true;

    firstIndicator.click();
    expect(firstIndicator.classList.contains('dot-active')).to.be.true;

    lastIndicator.click();
    expect(lastIndicator.classList.contains('dot-active')).to.be.true;
  });
});

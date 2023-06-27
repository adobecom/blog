/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { stub } from 'sinon';

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
const fragmentHtml = await readFile({ path: './mocks/body-fragment-plain.html' });

const { default: init } = await import('../../../blocks/banner/banner.js');

const delay = (timeOut, cb) => new Promise((resolve) => {
  setTimeout(() => {
    resolve((cb && cb()) || null);
  }, timeOut);
});

describe('Banner block', () => {
  it('renders the banner block', async () => {
    const FRAGMENT_PATH = '/en/promotions/security.plain.html';
    const block = document.querySelector('.banner');

    const mockFetch = stub(window, 'fetch');
    mockFetch.withArgs(FRAGMENT_PATH).returns(
      new Promise((resolve) => {
        resolve({
          ok: true,
          text: () => fragmentHtml,
        });
      }),
    );

    await init(block);
    await delay(100);
    const bannerImage = block.querySelector('.banner-image');
    expect(bannerImage).to.exist;
    expect(bannerImage.querySelector('picture')).to.exist;

    const bannerText = block.querySelector('.banner-text');
    expect(bannerText).to.exist;
    expect(bannerText.querySelector('h3')).to.exist;
    expect(bannerText.querySelector('.cta-link')).to.exist;

    mockFetch.restore();
  });
});

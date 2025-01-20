/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import { readFile } from '@web/test-runner-commands';
import { expect } from 'chai';
import { stub } from 'sinon';
import { setLibs } from '../../../scripts/utils.js';

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
const ogDoc = document.body.innerHTML;

const { default: init } = await import('../../../blocks/newsletter-modal/newsletter-modal.js');

describe('newsletter modal block', () => {
  before(() => {
    setLibs('https://milo.adobe.com/libs');
  });

  afterEach(() => {
    document.body.innerHTML = ogDoc;
  });

  it('should initialize the newsletter modal block', async () => {
    const block = document.querySelector('.newsletter-modal');
    await init(block);

    const bannerContainer = block.querySelector('.newsletter-modal-banner-container');
    expect(bannerContainer).to.exist;
    expect(bannerContainer.querySelector('picture')).to.exist;

    const content = block.querySelector('.newsletter-modal-content');
    expect(content).to.exist;
    expect(content.querySelector('.newsletter-modal-text')).to.exist;
    expect(content.querySelector('.newsletter-modal-form')).to.exist;
    expect(content.querySelector('.newsletter-modal-disclaimer')).to.exist;

    const form = content.querySelector('.newsletter-modal-form');
    expect(form.querySelector('.newsletter-modal-email-label')).to.exist;
    expect(form.querySelector('.newsletter-modal-email')).to.exist;
    expect(form.querySelector('.newsletter-modal-cta')).to.exist;
  });

  it('submits email successfully with valid email', async () => {
    const block = document.querySelector('.newsletter-modal');
    const successMsg = block.querySelector('div:nth-child(4) > div:nth-child(1)').textContent;

    await init(block);

    const mockFetch = stub(window, 'fetch');
    mockFetch.returns(new Promise((resolve) => {
      resolve(true);
    }));

    const inputField = block.querySelector('.newsletter-modal-email');
    inputField.value = 'valid@email.com';

    const ctaEl = block.querySelector('.newsletter-modal-cta');
    await ctaEl.click();

    expect(document.querySelector('.newsletter-modal-confirmation').textContent).to.be.equal(successMsg);

    mockFetch.restore();
  });

  it('does not submit form when email is not valid', async () => {
    const block = document.querySelector('.newsletter-modal');
    await init(block);

    const inputField = block.querySelector('.newsletter-modal-email');
    inputField.value = 'invalid-email';

    const ctaEl = block.querySelector('.newsletter-modal-cta');
    ctaEl.click();

    expect(inputField.classList.contains('error')).to.be.true;
  });

  it.skip('closes modal', async () => {
    // wrap newsletter in a modal
    const modal = document.createElement('div');
    modal.setAttribute('class', 'dialog-modal');
    const modalCurtain = document.createElement('div');
    modalCurtain.setAttribute('class', 'modal-curtain is-open');

    const block = document.querySelector('.newsletter-modal');
    modal.innerHTML = ogDoc;

    document.body.innerHTML = null;
    document.body.append(modal, modalCurtain);

    await init(block);

    const mockFetch = stub(window, 'fetch');
    mockFetch.returns(new Promise((resolve) => {
      resolve(true);
    }));

    const inputField = block.querySelector('.newsletter-modal-email');
    inputField.value = 'valid@email.com';

    const ctaEl = block.querySelector('.newsletter-modal-cta');
    await ctaEl.click();

    const closeButton = block.querySelector('.newsletter-modal-confirmation-close');
    closeButton.click();

    expect(document.querySelector('.dialog-modal')).to.be.not.exist;
    mockFetch.restore();
  });
});

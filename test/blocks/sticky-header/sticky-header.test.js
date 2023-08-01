/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../scripts/utils.js';

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
const ogDoc = document.body.innerHTML;

const { default: init } = await import('../../../blocks/sticky-header/sticky-header.js');

describe('init', async () => {
  before(() => {
    setLibs('https://milo.adobe.com/libs');
  });

  afterEach(() => {
    document.body.innerHTML = ogDoc;
  });

  it('creates sticky header block', async () => {
    const block = document.querySelector('.sticky-header');
    await init(block);
    expect(block.querySelector('.sticky-header-close')).to.be.exist;
  });

  it('removes sticky header when close button is clicked', async () => {
    const block = document.querySelector('.sticky-header');
    await init(block);
    const button = document.body.querySelector('.sticky-header-close');
    sinon.fake();
    button.click();
    expect(document.body.querySelector('.sticky-header')).to.not.exist;
  });
});

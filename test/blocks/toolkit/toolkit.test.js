/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../scripts/utils.js';

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
const { default: init } = await import('../../../blocks/toolkit/toolkit.js');

describe('init', () => {
  before(() => {
    setLibs('https://milo.adobe.com/libs');
  });

  it('should decorate rows and CTA rows', async () => {
    const block = document.querySelector('.toolkit-normal');

    await init(block);

    const row = block.querySelector('.row');
    expect(row).to.exist;
    expect(row.querySelector('.row-image')).to.exist;
    expect(row.querySelector('.row-content')).to.exist;
  });

  it('should decorate CTAs', async () => {
    const block = document.querySelector('.toolkit-link');

    await init(block);

    expect(block.querySelector('.ctas')).to.exist;
  });

  it('should handle single column rows', async () => {
    const block = document.createElement('div');
    const row = document.createElement('div');

    row.classList.add('single');
    block.appendChild(row);

    await init(block);

    expect(row.classList.contains('column')).to.be.true;
  });
});

/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { buildAutoBlocks, setLibs } from '../../../scripts/utils.js';

const miloLibs = setLibs('https://milo.adobe.com/libs');
const { loadArea, getConfig, setConfig } = await import(`${miloLibs}/utils/utils.js`);
const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };
const conf = { locales, miloLibs };
setConfig(conf);
const config = getConfig();
config.locale.contentRoot = '/test/blocks/full-width-header/mocks';

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
document.head.innerHTML = await readFile({ path: './mocks/head.html' });
const ogHead = document.head.innerHTML;
const ogBody = document.body.innerHTML;

describe('init', async () => {
  before(() => {
  });

  afterEach(() => {
    document.head.innerHTML = ogHead;
    document.body.innerHTML = ogBody;
  });

  it('creates article-header block and removes full-width header block', async () => {
    await buildAutoBlocks();
    await loadArea();

    const articleHeader = document.body.querySelector('.article-header');
    expect(articleHeader).to.be.exist;
    const picture = document.querySelector('.article-feature-image picture');
    expect(picture).to.be.exist;
    const caption = document.querySelector('.article-feature-image figcaption');
    expect(caption).to.be.exist;
    const text = caption.querySelector('.caption').innerHTML;
    expect(text).to.be.equal('Film artists use Adobe Substance 3D');
    const fullWidthHeader = document.querySelector('.full-width-header');
    expect(fullWidthHeader).to.not.exist;
  }).timeout(5000);
});
